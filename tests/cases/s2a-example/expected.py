from __future__ import annotations


def main() -> None:
    print("掛け算九九の表")
    print("=================")
    for i in range(9):
        row: str = ""
        for j in range(9):
            num1: int = i + 1
            num2: int = j + 1
            result: int = num1 * num2
            if result < 10:
                row = row + f" {result} "
            else:
                row = row + f"{result} "
        print(row)


if __name__ == "__main__":
    main()
