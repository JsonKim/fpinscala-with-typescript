import * as R from 'ramda'
import { Lazy } from 'fp-ts/lib/function'

namespace Par {
  export interface Par<A> {
    (): A
  }

  export const unit = <A>(a: Lazy<A>): Par<A> => () => a()

  export const get = <A>(a: Par<A>): A => a()
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
    const sumL = Par.unit(() => sum(l))
    const sumR = Par.unit(() => sum(r))
    return Par.get(sumL) + Par.get(sumR)
  }
}
