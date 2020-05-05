import 'fp-ts/lib/HKT'
import { Show, showNumber } from 'fp-ts/lib/Show'
import { absurd } from 'fp-ts/lib/function'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly List: List<A>
  }
}

export const URI = 'List'

export type URI = typeof URI

type List<A> = Cons<A> | Nil

function getShow<A>(S: Show<A>): Show<List<A>> {
  return {
    show: (ma) => {
      switch (ma._tag) {
        case 'Nil':
          return 'Nil'
        case 'Cons':
          return `Cons(${S.show(ma.head)}, ${getShow(S).show(ma.tail)})`
        default:
          return absurd(ma)
      }
    },
  }
}

const List = <A>(...as: A[]): List<A> =>
  as.reduceRight((acc: List<A>, a: A) => cons(a, acc), nil)

interface Cons<A> {
  readonly _tag: 'Cons'
  readonly head: A
  readonly tail: List<A>
}

interface Nil {
  readonly _tag: 'Nil'
}

const nil: List<never> = { _tag: 'Nil' }

const cons = <A>(h: A, t: List<A>): List<A> => ({ _tag: 'Cons', head: h, tail: t })

const sum = (ints: List<number>): number => {
  switch (ints._tag) {
    case 'Nil':
      return 0
    case 'Cons':
      return ints.head + sum(ints.tail)
    default:
      return absurd(ints)
  }
}

const product = (ds: List<number>): number => {
  if (ds._tag === 'Nil') {
    return 1.0
  } else if (ds._tag === 'Cons' && ds.head === 0.0) {
    return 0.0
  } else if (ds._tag) {
    return ds.head * product(ds.tail)
  } else {
    return absurd(ds)
  }
}

const tail = <A>(xs: List<A>): List<A> => {
  if (xs._tag === 'Nil') {
    throw new Error('tail of empty list')
  } else {
    return xs.tail
  }
}

const setHead = <A>(x: A, xs: List<A>): List<A> => {
  if (xs._tag === 'Nil') {
    throw new Error('setHead on empty list')
  } else {
    return cons(x, xs.tail)
  }
}

const drop = <A>(l: List<A>, n: number): List<A> => {
  if (n <= 0) return l
  else if (l._tag === 'Nil') return nil
  else return drop(l.tail, n - 1)
}

const dropWhile = <A>(l: List<A>, f: (a: A) => boolean): List<A> => {
  switch (l._tag) {
    case 'Nil':
      return l
    case 'Cons': {
      if (f(l.head)) return dropWhile(l.tail, f)
      else return l
    }
    default:
      return absurd(l)
  }
}

const append = <A>(a1: List<A>, a2: List<A>): List<A> => {
  if (a1._tag === 'Nil') return a2
  else return cons(a1.head, append(a1.tail, a2))
}

// 마지막 원소를 제외한 모든 원소를 복사해야 하기 때문에 비효율적이다.
const init = <A>(l: List<A>): List<A> => {
  if (l._tag === 'Nil') return nil
  else if (l.tail._tag !== 'Nil' && l.tail.tail._tag === 'Nil') return cons(l.head, nil)
  else return cons(l.head, init(l.tail))
}

interface Match<A, B> {
  Nil: () => B,
  Cons: (h: A, t: List<A>) => B
}

const match = <A>(as: List<A>) => <B>(m: Match<A, B>): B => {
  switch (as._tag) {
    case 'Nil':
      return m.Nil()
    case 'Cons':
      return m.Cons(as.head, as.tail)
    default:
      return absurd(as)
  }
}

const foldRight = <A, B>(as: List<A>, z: B) => (f: (a: A, b: B) => B): B =>
  match(as)({
    Nil: () => z,
    Cons: (x, xs) => f(x, foldRight(xs, z)(f)),
  })

const sum2 = (ns: List<number>) =>
  foldRight(ns, 0)((x: number, y: number) => x + y)

const product2 = (ns: List<number>) =>
  foldRight(ns, 1.0)((x: number, y: number) => x * y)

const main = () => {
  const ds = List(1, 2, 3, 4)
  console.log(sum(ds))
  console.log(product(ds))
  console.log(getShow(showNumber).show(tail(ds)))
  try {
    console.log(tail(nil))
  } catch (e) {
    console.error(e)
  }
  console.log(getShow(showNumber).show(setHead(0, ds)))
  console.log(getShow(showNumber).show(dropWhile(ds, (x: number) => x < 3)))
  console.log(getShow(showNumber).show(dropWhile(ds, x => x < 3)))
  console.log(getShow(showNumber).show(drop(ds, 2)))
  console.log(getShow(showNumber).show(drop(nil, 2)))
  console.log(getShow(showNumber).show(init(ds)))
  console.log(sum2(ds))
  console.log(product2(ds))
}

main()
