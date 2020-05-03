
module MyModule {
  export const abs = (n: number): number => {
    if (n < 0) return -n
    else return n
  }

  const formatAbs = (n: number): string => `The absolute value of ${n} is ${abs(n)}`

  export const main = (): void => {
    console.log(formatAbs(-42))
  }

  export const factorial = (n: number): number => {
    const go = (n: number, acc: number): number => {
      if (n <= 0) return acc
      else return go(n - 1, n * acc)
    }

    return go(n, 1)
  }
}

MyModule.main()
