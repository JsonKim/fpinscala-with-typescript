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

/* 연습문제 3.7
 * product2는 foldRight가 0.0을 만났을때에 대한 처리가 따로 없고 꼬리 재귀가 아니기 때문에 끝까지 진행된다.
 */

/* 연습문제 3.8
 * 동일한 목록이 생성된다. foldRight는 자료구조의 형태를 유지시킨다.
 */

const length = <A>(as: List<A>): number => foldRight(as, 0)((_, acc) => acc + 1)

const foldLeft = <A, B>(as: List<A>, z: B) => (f: (b: B, a: A) => B): B =>
  match(as)({
    Nil: () => z,
    Cons: (x, xs) => foldLeft(xs, f(z, x))(f),
  })

const sum3 = (ns: List<number>) =>
  foldLeft(ns, 0)((x: number, y: number) => x + y)

const product3 = (ns: List<number>) =>
  foldLeft(ns, 1.0)((x: number, y: number) => x * y)

const length2 = <A>(as: List<A>): number =>
  foldLeft(as, 0)((acc, _) => acc + 1)

const reverse = <A>(as: List<A>): List<A> =>
  foldLeft(as, nil as List<A>)((t, h) => cons(h, t))

// foldLeft(1 :: 2 :: 3 :: 4 :: Nil, Nil)((t, h) => h :: t)
// foldLeft(2 :: 3 :: 4 :: Nil, 1 :: Nil)((t, h) => h :: t)
// foldLeft(3 :: 4 :: Nil, 2 :: 1 :: Nil)((t, h) => h :: t)
// foldLeft(4 :: Nil, 3 :: 2 :: 1 :: Nil)((t, h) => h :: t)
// foldLeft(Nil, 4 :: 3 :: 2 :: 1 :: Nil)((t, h) => h :: t)
// 4 :: 3 :: 2 :: 1 :: Nil

// foldLeft(1 :: 2 :: 3 :: 4 :: Nil, 0)((acc, h) => acc + h)
// foldLeft(2 :: 3 :: 4 :: Nil, (0 + 1))((acc, h) => acc + h)
// foldLeft(3 :: 4 :: Nil, (0 + 1) + 2)((acc, h) => acc + h)
// foldLeft(4 :: Nil, ((0 + 1) + 2) + 3)((acc, h) => acc + h)
// foldLeft(Nil, (((0 + 1) + 2) + 3) + 4)((acc, h) => acc + h)
// (((0 + 1) + 2) + 3) + 4)
// 만약 h + acc를 선택했다면 최종 결과는 이렇게 합산되었을 것이다.
// foldLeft(3 :: 4 :: Nil, 2 + (1 + 0))((acc, h) => h + acc)
// 4 + (3 + (2 + (1 + 0)))

// foldRight(1 :: 2 :: 3 :: 4 :: Nil, Nil)((h, t) => h :: t)
// 1 :: foldRight(2 :: 3 :: 4 :: Nil, Nil)((h, t) => h :: t)
// 1 :: 2 :: foldRight(3 :: 4 :: Nil, Nil)((h, t) => h :: t)
// 1 :: 2 :: 3 :: foldRight(4 :: Nil, Nil)((h, t) => h :: t)
// 1 :: 2 :: 3 :: 4 :: foldRight(Nil, Nil)((h, t) => h :: t)
// 1 :: 2 :: 3 :: 4 :: Nil

// foldRight(1 :: 2 :: 3 :: 4 :: Nil, 0)((h, acc) => h + acc)
// 1 + foldRight(2 :: 3 :: 4 :: Nil, 0)((h, acc) => h + acc)
// 1 + (2 + foldRight(3 :: 4 :: Nil, 0)((h, acc) => h + acc))
// 1 + (2 + (3 + foldRight(4 :: Nil, 0)((h, acc) => h + acc)))
// 1 + (2 + (3 + (4 + foldRight(Nil, 0)((h, acc) => h + acc))))
// 1 + (2 + (3 + (4 + 0)))
// 만약 acc + h를 선택했다면 최종 결과는 이렇게 합산되었을 것이다.
// (foldRight(3 :: 4 :: Nil, 0)((h, acc) => acc + h) + 2) + 1
// (((0 + 4) + 3) + 2) + 1

// foldLeft와 foldRight의 연산 순서에 따른 차이도 눈여겨 보자

const foldRight2 = <A, B>(as: List<A>, z: B) => (f: (a: A, b: B) => B): B =>
  foldLeft(reverse(as), z)((b, a) => f(a, b))

// reverse를 사용하여 목록을 뒤집는 대신, combinerDelayer를 사용하여 연산의 순서를 뒤집는다. 이것도 cps의 일종인가?
const foldLeft2 = <A, B>(as: List<A>, outerIdent: B) => (combiner: (b: B, a: A) => B): B => {
  type BtoB = (b: B) => B

  const innerIdent: BtoB = (b: B) => b

  const combinerDelayer: (a: A, bToB: BtoB) => BtoB =
    (a: A, delayFunc: BtoB) => (b: B) => delayFunc(combiner(b, a))

  const go: BtoB = foldRight(as, innerIdent)(combinerDelayer)

  return go(outerIdent)
}

// foldLeft에 z를 cps로 주었다. 이제 z는 직접적인 값이 아닌 나중에 실행 가능한 값으로 대체된다.
const foldRight3 = <A, B>(as: List<A>, z: B) => (f: (a: A, b: B) => B): B =>
  foldLeft(as, (b: B) => b)((ret, a) => b => ret(f(a, b)))(z)

// h :: forall a. a
// b :: forall a. List a
// t :: forall a. List a
// ret :: forall a. List a -> List a

// foldLeft(Nil, b => b)((ret, h) => t => h :: ret(t))
// b => b

// foldLeft(1 :: 2 :: Nil, (b => b))((ret, h) => t => ret(h :: t))
// foldLeft(2 :: Nil, (b =>
//   ((h1, t1) => h1 :: t1)(1, b)
// ))((ret, h) => t => ret(h :: t))
// foldLeft(Nil, (b =>
//   ((h1, t1) => h1 :: ((h2, t2) => h2 :: t2)(2, t1))(1, b)
// ))((ret, h) => t => ret(h :: t))
// (b => ((h1, t1) => h1 :: ((h2, t2) => h2 :: t2)(2, t1))(1, b))(Nil)
// ((h1, t1) => h1 :: ((h2, t2) => h2 :: t2)(2, t1))(1, Nil)
// ((h1, t1) => h1 :: 2 :: t1)(1, Nil)
// (1 :: 2 :: Nil)

// foldLeft(2 :: Nil, b => {
//   const ret = (h, t) => (h :: t)
//   return ret(1, b)
// })((ret, h) => t => ret(h :: t))
// foldLeft(Nil, b => {
//   const ret = (h, t) => (h :: t)
//   return ret(1, ret(2, b))
// })((ret, h) => t => ret(h :: t))

const append2 = <A>(a1: List<A>, a2: List<A>): List<A> =>
  foldRight(a1, a2)((a, acc) => cons(a, acc))

const flat = <A>(ass: List<List<A>>): List<A> =>
  foldRight(ass, nil as List<A>)((as, acc) => append(as, acc))

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
  console.log(length(ds))
  console.log(getShow(showNumber).show(reverse(ds)))
  console.log(getShow(showNumber).show(foldRight(ds, nil as List<number>)((h, t) => cons(h, t))))
  console.log(getShow(showNumber).show(foldRight2(ds, nil as List<number>)((h, t) => cons(h, t))))
  console.log(getShow(showNumber).show(foldLeft2(ds, nil as List<number>)((t, h) => cons(h, t))))
}

main()
