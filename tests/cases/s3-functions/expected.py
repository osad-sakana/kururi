from __future__ import annotations


calls: int = 0


def main() -> None:
    print(fact(5))
    print(average([80, 65, 91]))
    print(sign(-3))
    print(calls)


def fact(n: int) -> int:
    global calls
    calls += 1
    if n <= 1:
        return 1
    return n * fact(n - 1)


def average(scores: list[int]) -> float:
    sum: int = 0
    for s in scores:
        sum += s
    return sum / len(scores)


def sign(n: int) -> int:
    if n < 0:
        return -1
    elif n == 0:
        return 0
    else:
        return 1


if __name__ == "__main__":
    main()
