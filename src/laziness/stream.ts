import 'fp-ts/lib/HKT'
import { Show, showNumber } from 'fp-ts/lib/Show'
import { absurd, Lazy } from 'fp-ts/lib/function'
import {
  Option, none, some, isNone, Some,
} from 'fp-ts/lib/Option'
import * as L from '../datastructures/list'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Stream: Stream<A>
  }
}

export const URI = 'Stream'

export type URI = typeof URI

export type Stream<A> = Cons<A> | Empty

interface Cons<A> {
  readonly _tag: 'Cons'
  readonly h: Lazy<A>
  readonly t: Lazy<Stream<A>>
}

interface Empty {
  readonly _tag: 'Empty'
}

function getShow<A>(S: Show<A>): Show<Stream<A>> {
  return {
    show: (ma) => {
      switch (ma._tag) {
        case 'Empty':
          return 'Empty'
        case 'Cons':
          return `Cons(${S.show(ma.h())}, ${getShow(S).show(ma.t())})`
        default:
          return absurd(ma)
      }
    },
  }
}

// http://matt.might.net/articles/implementing-laziness/
function memothunk<A>(f: Lazy<A>): Lazy<A> {
  let result: A | null = null

  return () => {
    if (result !== null) {
      return result
    }

    result = f()
    return result
  }
}

function* Seq<A>(...as: A[]) {
  // eslint-disable-next-line no-restricted-syntax
  for (const a of as) {
    yield a
  }
}

export const stream = <A>(as: Generator<A, void, unknown>): Stream<A> => {
  const n = as.next()
  if (n.done) {
    return empty
  }

  return cons(() => n.value, () => stream(as))
}

export const empty: Stream<never> = { _tag: 'Empty' }

export const cons = <A>(hd: Lazy<A>, tl: Lazy<Stream<A>>): Stream<A> => {
  const head = memothunk(hd)
  const tail = memothunk(tl)

  return {
    _tag: 'Cons',
    h: head,
    t: tail,
  }
}

const ones: Stream<number> = cons(() => 1, () => ones)

const constant = <A>(a: A): Stream<A> =>
  memothunk(() => cons(() => a, () => constant(a)))()

const from = (n: number): Stream<number> =>
  cons(() => n, () => from(n + 1))

const fibs = (): Stream<number> => {
  const go = (n1: number, n2: number): Stream<number> =>
    cons(() => n1, () => go(n2, n1 + n2))

  return go(0, 1)
}

type Pair<A, B> = [A, B]

const pair = <A, B>(a: A, b: B): Pair<A, B> => [a, b]

const unfold = <A, S>(z: S, f: (s: S) => Option<Pair<A, S>>): Stream<A> => {
  const n = f(z)
  if (isNone(n)) {
    return empty
  } else {
    const [a, s] = n.value
    return cons(() => a, () => unfold(s, f))
  }
}

const fibs2 = (): Stream<number> =>
  unfold([0, 1], ([c, n]) => some([n, [n, c + n]]))

const from2 = (n: number): Stream<number> =>
  unfold(n, (s) => some([s, s + 1]))

const constant2 = <A>(a: A): Stream<A> =>
  unfold(a, (_) => some([a, a]))

const ones2: Stream<number> = unfold(1, (_) => some([1, 1]))

module Stream {
  interface Match<A, B> {
    Empty: () => B,
    Cons: (h: Lazy<A>, t: Lazy<Stream<A>>) => B
  }

  const match = <A>(as: Stream<A>) => <B>(m: Match<A, B>): B => {
    switch (as._tag) {
      case 'Empty':
        return m.Empty()
      case 'Cons':
        return m.Cons(as.h, as.t)
      default:
        return absurd(as)
    }
  }

  const foldRight = <A>(as: Stream<A>) => <B>(z: () => B, f: (a: A, b: Lazy<B>) => B): B =>
    match(as)({
      Cons: (h, t) => f(h(), () => foldRight(t())(z, f)),
      Empty: z,
    })

  const exists = <A>(as: Stream<A>) => (p: (a: A) => boolean): boolean =>
    foldRight(as)((): boolean => false, (a, b) => p(a) || b())

  const toList = <A>(as: Stream<A>): L.List<A> =>
    foldRight(as)(() => L.nil as L.List<A>, (a, b) => L.cons(a, b()))

  const toListTR = <A>(as: Stream<A>): L.List<A> => {
    const go = (s: Stream<A>, acc: L.List<A>): L.List<A> =>
      match(s)({
        Cons: (h, t) => go(t(), L.cons(h(), acc)),
        Empty: () => acc,
      })

    return L.reverse(go(as, L.nil))
  }

  const take = <A>(as: Stream<A>, n: number): Stream<A> => {
    if (n <= 0) {
      return empty
    }

    return match(as)({
      Empty: () => empty,
      Cons: (h, t) => cons(h, () => take(t(), n - 1)),
    })
  }

  const drop = <A>(as: Stream<A>, n: number): Stream<A> => {
    if (n <= 0) {
      return as
    }

    return match(as)({
      Empty: () => empty,
      Cons: (_, t) => drop(t(), n - 1),
    })
  }

  const takeWhile = <A>(as: Stream<A>, p: (a: A) => boolean): Stream<A> => {
    if (as._tag === 'Cons' && p(as.h())) {
      return cons(as.h, () => takeWhile(as.t(), p))
    } else {
      return empty
    }
  }

  const forAll = <A>(as: Stream<A>, p: (a: A) => boolean): boolean =>
    foldRight(as)((): boolean => true, (h, t) => p(h) && t())

  const takeWhile2 = <A>(as: Stream<A>, p: (a: A) => boolean): Stream<A> =>
    foldRight(as)((): Stream<A> => empty, (h, t) =>
      (p(h)
        ? cons(() => h, t)
        : empty))

  const headOption = <A>(as: Stream<A>): Option<A> =>
    foldRight(as)((): Option<A> => none, (h, _) => some(h))

  const map = <A>(as: Stream<A>) => <B>(f: (a: A) => B): Stream<B> =>
    foldRight(as)((): Stream<B> => empty, (h, t) => cons(() => f(h), t))

  const filter = <A>(as: Stream<A>) => (p: (a: A) => boolean): Stream<A> =>
    foldRight(as)((): Stream<A> => empty, (h, t) =>
      (p(h)
        ? cons(() => h, t)
        : t()))

  const append = <A>(xs: Stream<A>, ys: () => Stream<A>): Stream<A> =>
    foldRight(xs)(ys, (h, t) => cons(() => h, t))

  const flatMap = <A>(as: Stream<A>) => <B>(f: (a: A) => Stream<B>): Stream<B> =>
    foldRight(as)((): Stream<B> => empty, (h, t) => append(f(h), t))

  const map2 = <A>(as: Stream<A>) => <B>(f: (a: A) => B): Stream<B> =>
    unfold(as, s => match(s)({
      Cons: (h, t) => some([f(h()), t()]),
      Empty: () => none,
    }))

  const take2 = <A>(as: Stream<A>, n: number): Stream<A> =>
    unfold(pair(n, as), ([n, as]) =>
      ((n <= 0)
        ? none
        : match(as)({
          Cons: (h, t) => some(pair(h(), pair(n - 1, t()))),
          Empty: () => none,
        })))

  const takeWhile3 = <A>(as: Stream<A>, p: (a: A) => boolean): Stream<A> =>
    unfold(as, s =>
      match(s)({
        Cons: (h, t) => (p(h()) ? some(pair(h(), t())) : none),
        Empty: () => none,
      }))

  const zipWith = <A>(s1: Stream<A>, s2: Stream<A>) => <B>(f: (x: Lazy<A>, y: Lazy<A>) => B): Stream<B> =>
    unfold(pair(s1, s2), ([s1, s2]) => {
      if (s1._tag === 'Empty' || s2._tag === 'Empty') {
        return none
      } else {
        return some(pair(f(s1.h, s2.h), pair(s1.t(), s2.t())))
      }
    })

  const zipAll = <A, B>(s1: Stream<A>, s2: Stream<B>): Stream<Pair<Option<A>, Option<B>>> =>
    unfold(pair(s1, s2), ([s1, s2]) => {
      if (s1._tag === 'Empty' && s2._tag === 'Empty') {
        return none
      } else if (s1._tag === 'Cons' && s2._tag === 'Empty') {
        return some(pair(pair(some(s1.h()), none), pair(s1.t(), empty)))
      } else if (s1._tag === 'Empty' && s2._tag === 'Cons') {
        return some(pair(pair(none, some(s2.h())), pair(empty, s2.t())))
      } else if (s1._tag === 'Cons' && s2._tag === 'Cons') {
        return some(pair(pair(some(s1.h()), some(s2.h())), pair(s1.t(), s2.t())))
      }

      return none
    })

  const startsWith = <A>(s1: Stream<A>, s2: Stream<A>): boolean =>
    forAll(takeWhile(zipAll(s1, s2), ([_, oa2]) => oa2._tag === 'Some'), ([h1, h2]) =>
      (h1 as Some<A>).value === (h2 as Some<A>).value)

  const tails = <A>(as: Stream<A>): Stream<Stream<A>> =>
    unfold(as, s => match(s)({
      Cons: (_, t) => some(pair(s, t())),
      Empty: () => none,
    }))

  const hasSubsequence = <A>(s1: Stream<A>, s2: Stream<A>): boolean =>
    exists(tails(s1))(s => startsWith(s, s2))

  // unfold는 왼쪽에서부터 값을 생성하기 때문에 사용할 수 없다.
  const scanRight = <A>(as: Stream<A>) => <B>(z: Lazy<B>, f: (a: A, b: Lazy<B>) => B): Stream<B> =>
    foldRight(as)(() => pair(z, cons(z, () => empty)), (a, p0) => {
      const p1 = memothunk(p0)()
      const b2 = f(a, p1[0])
      console.log(a, p1[0]())
      return pair(() => b2, cons(() => b2, () => p1[1]))
    })[1]

  export const main = () => {
    const ds = stream(Seq(1, 2, 3, 4, 5))

    console.log(getShow(showNumber).show(ds))
    console.log(L.getShow(showNumber).show(toList(ds)))
    console.log(L.getShow(showNumber).show(toListTR(ds)))
    console.log(L.getShow(showNumber).show(toList(take(ds, 2))))
    console.log(L.getShow(showNumber).show(toList(drop(ds, 2))))
    console.log(L.getShow(showNumber).show(toList(take(ones, 5))))
    console.log(forAll(ones, (a) => a !== 1))
    console.log(headOption(ones))
    console.log(headOption(empty))
    console.log(L.getShow(showNumber).show(toList(take(from(5), 5))))
    console.log(L.getShow(showNumber).show(toList(take(fibs(), 5))))
    console.log(L.getShow(showNumber).show(toList(take2(ones, 5))))
    console.log(startsWith(from(1), ds))
    console.log(getShow(getShow(showNumber)).show(tails(ds)))
    console.log(getShow(showNumber).show(scanRight(take(ds, 3))(() => 0, (a, b) => a + b())))
  }
}

Stream.main()
