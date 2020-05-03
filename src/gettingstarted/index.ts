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
    console.log(formatFactorial(7))
    console.log(formatResult('absolute value', -42, abs))
    console.log(formatResult('factorial', 7, factorial))
    console.log(isSorted([1, 2, 3, 4], (x, y) => x < y))
    console.log(isSorted([1, 2, 3, 4], (x, y) => x > y))
    console.log(isSorted([1, 2, 2, 4], (x, y) => x < y))
    console.log(isSorted([1], (x, y) => x > y))
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

  const formatFactorial = (n: number): string => `The factorial of ${n} is ${factorial(n)}`

  const formatResult = (name: string, n: number, f: (x: number) => number) => `The ${name} of ${n} is ${f(n)}`

  const isSorted = <A>(as: Array<A>, ordered: (x: A, y: A) => boolean): boolean => {
    const go = (n: number): boolean => {
      if (n >= as.length - 1) return true
      else if (ordered(as[n + 1], as[n])) return false
      else return go(n + 1)
    }

    return go(0)
  }
}

MyModule.main()
