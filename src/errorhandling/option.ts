import 'fp-ts/lib/HKT'
import { absurd } from 'fp-ts/lib/function'
import * as R from 'ramda'

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly Option_: Option<A>
  }
}

export const URI = 'Option'

export type URI = typeof URI

type Option<A> = Some<A> | None

interface Match<A, B> {
  None: () => B,
  Some: (get: A) => B
}

interface Some<A> {
  readonly _tag: 'Some'
  readonly get: A
}

interface None {
  readonly _tag: 'None'
}

const Some = <A>(a: A): Some<A> => ({
  _tag: 'Some',
  get: a,
})

const None: None = ({
  _tag: 'None',
})

module Option {
  const match = <A>(x: Option<A>) => <B>(m: Match<A, B>): B => {
    switch (x._tag) {
      case 'None':
        return m.None()
      case 'Some':
        return m.Some(x.get)
      default:
        return absurd(x)
    }
  }

  const map = <A>(o: Option<A>) => <B>(f: (a: A) => B): Option<B> =>
    match(o)({
      None: () => None as Option<B>,
      Some: (a) => Some(f(a)),
    })

  const flatMap = <A>(o: Option<A>) => <B>(f: (a: A) => Option<B>): Option<B> =>
    getOrElse(map(o)(f), () => None)

  const getOrElse = <A>(o: Option<A>, d: () => A): A =>
    match(o)({
      None: () => d(),
      Some: (a) => a,
    })

  const orElse = <A>(o: Option<A>, ob: () => Option<A>): Option<A> =>
    getOrElse(map(o)(Some), ob)

  const filter = <A>(o: Option<A>, f: (a: A) => boolean): Option<A> =>
    flatMap(o)(x => (f(x) ? Some(x) : None))

  const mean = (xs: Array<number>): Option<number> => {
    if (xs.length === 0) return None
    else return Some(R.sum(xs) / xs.length)
  }

  const variance = (xs: Array<number>): Option<number> =>
    flatMap(mean(xs))((m) =>
      mean(xs.map(x => (x - m) ** 2)))

  export const main = () => {
    console.log(orElse(Some(1), () => Some(0)))
    console.log(orElse(None, () => Some(0)))
    console.log(orElse(Some(None as Option<number>), () => Some(Some(0))))
    console.log(map(None)(Some)) // None
    console.log(Some(None)) // Some(None)
    console.log(map(Some(1))(Some)) // Some(Some(1))
    console.log(Some(Some(1))) // Some(Some(1))
  }
}

Option.main()
