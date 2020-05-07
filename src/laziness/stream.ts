import 'fp-ts/lib/HKT'
import { Show, showNumber } from 'fp-ts/lib/Show'
import { absurd, Lazy } from 'fp-ts/lib/function'
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
      Empty: () => z(),
    })

  export const main = () => {
  }
}

Stream.main()
