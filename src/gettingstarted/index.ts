module MyModule {
  export const abs = (n: number): number => {
    if (n < 0) return -n
    else return n
  }

  const formatAbs = (n: number): string => `The absolute value of ${n} is ${abs(n)}`

  export const main = (): void => {
    console.log(formatAbs(-42))
    console.log(fib(0))
    console.log(fib(1))
    console.log(fib(2))
    console.log(fib(3))
    console.log(fib(4))
    console.log(fib(5))
  }

  export const factorial = (n: number): number => {
    const go = (n: number, acc: number): number => {
      if (n <= 0) return acc
      else return go(n - 1, n * acc)
    }

    return go(n, 1)
  }

  export const fib = (n: number): number => {
    const go = (n: number, prev: number, cur: number): number => {
      if (n <= 0) return prev
      else return go(n - 1, cur, prev + cur)
    }

    return go(n, 0, 1)
  }
}

MyModule.main()
