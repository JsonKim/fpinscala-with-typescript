import 'fp-ts/lib/HKT'
import { absurd } from 'fp-ts/lib/function'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly Either_: Either<E, A>
  }
}

export const URI = 'Either'

export type URI = typeof URI

type Either<E, A> = Left<E> | Right<A>

interface Left<E> {
  readonly _tag: 'Left'
  readonly get: E
}

interface Right<A> {
  readonly _tag: 'Right'
  readonly get: A
}

const Left = <E>(e: E): Left<E> => ({
  _tag: 'Left',
  get: e,
})

const Right = <A>(a: A): Left<A> => ({
  _tag: 'Left',
  get: a,
})

module Either {
  interface Match<E, A, EE, AA> {
    Left: (get: E) => EE,
    Right: (get: A) => AA,
  }

  const match = <E, A>(x: Either<E, A>) => <EE, AA>(m: Match<E, A, EE, AA>): EE | AA => {
    switch (x._tag) {
      case 'Left':
        return m.Left(x.get)
      case 'Right':
        return m.Right(x.get)
      default:
        return absurd(x)
    }
  }

  const map = <E, A>(x: Either<E, A>) => <B>(f: (a: A) => B): Either<E, B> =>
    match(x)({
      Left: (e) => Left(e) as Either<E, B>,
      Right: (a) => Right(f(a)) as unknown as Either<E, B>,
    })

  const flatMap = <E, A>(x: Either<E, A>) => <B>(f: (a: A) => Either<E, B>): Either<E, B> =>
    match(x)({
      Left: (e) => Left(e) as Either<E, B>,
      Right: (a) => f(a),
    })

  const orElse = <E, A>(x: Either<E, A>, b: () => Either<E, A>): Either<E, A> =>
    match(x)({
      Left: (_) => b() as Either<E, A>,
      Right: (a) => Right(a) as unknown as Either<E, A>,
    })

  const map2 = <E, A, B>(oa: Either<E, A>, ob: Either<E, B>) => <C>(f: (a: A, b: B) => C): Either<E, C> =>
    flatMap(oa)(a =>
      map(ob)(b =>
        f(a, b)))
}
