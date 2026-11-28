TAX_RATE = 0.1
合計 = 0


def main():
    price = 1200
    count = 3
    total = price * count
    with_tax = total * (1 + TAX_RATE)
    is_big = total > 3000 and not (count == 0)
    print("小計: " + str(total))
    print(f"税込: {with_tax} 円（個数 {count}、{{そのまま}}）")
    print("true" if is_big else "false")
    print(7 / 2)
    print(-7 % 3)


if __name__ == "__main__":
    main()
