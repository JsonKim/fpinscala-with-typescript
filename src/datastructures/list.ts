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
}

main()
