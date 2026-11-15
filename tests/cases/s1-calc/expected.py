from __future__ import annotations


taxRate: float = 0.1
合計: int = 0


def main() -> None:
    price: int = 1200
    count: int = 3
    total: int = price * count
    withTax: float = total * (1 + taxRate)
    big: bool = total > 3000 and not (count == 0)
    print("小計: " + str(total))
    print(f"税込: {withTax} 円（個数 {count}、{{そのまま}}）")
    print("true" if big else "false")
    print(7 / 2)
    print(-7 % 3)


if __name__ == "__main__":
    main()
