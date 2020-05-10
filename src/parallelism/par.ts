import * as R from 'ramda'
import { Lazy } from 'fp-ts/lib/function'

namespace Par {
  export interface Par<A> {
    (): A
  }

  export const unit = <A>(a: Lazy<A>): Par<A> => () => a()

  export const get = <A>(a: Par<A>): A => a()

  export const map2 = <A>(p1: Par<A>, p2: Par<A>) => <B>(f: (a1: A, a2: A) => B): Par<B> =>
    unit(() => f(get(p1), get(p2)))
}

namespace example {
  type Par<A> = Par.Par<A>

  const sum = (ints: Array<number>): number => {
    if (ints.length === 0) return 0
    if (ints.length === 1) return ints[0]

    const [l, r] = R.splitAt(ints.length / 2, ints)
    return sum(l) + sum(r)
  }

  const sum2 = (ints: Array<number>): number => {
    if (ints.length === 0) return 0
    if (ints.length === 1) return ints[0]

    const [l, r] = R.splitAt(ints.length / 2, ints)
    const sumL = Par.unit(() => sum2(l))
    const sumR = Par.unit(() => sum2(r))
    return Par.get(sumL) + Par.get(sumR)
  }

  const sum3 = (ints: Array<number>): Par<number> => {
    if (ints.length === 0) return Par.unit(() => 0)
    if (ints.length === 1) return Par.unit(() => ints[0])

    const [l, r] = R.splitAt(ints.length / 2, ints)
    return Par.map2(sum3(l), sum3(r))((l, r) => l + r)
  }
}
