from __future__ import annotations


total: int = 0


def main() -> None:
    global total
    n: int = 0
    while True:
        n += 1
        if n % 2 == 0:
            continue
        elif n > 7:
            break
        else:
            total += n
    print(f"合計は {total}")


if __name__ == "__main__":
    main()
