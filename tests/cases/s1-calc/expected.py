TAX_RATE = 0.1
合計 = 0


def main():
    price = 1200
    count = 3
    total = price * count
    with_tax = float(total) * (1.0 + TAX_RATE)
    big = total > 3000 and not (count == 0)
    print("小計: " + str(total))
    print(f"税込: {with_tax} 円（個数 {count}、{{そのまま}}）")
    print("true" if big else "false")
    print(7 / 2)
    print(-7 % 3)


if __name__ == "__main__":
    main()
