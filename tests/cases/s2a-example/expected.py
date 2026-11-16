def main():
    print("掛け算九九の表")
    print("=================")
    for i in range(9):
        row = ""
        for j in range(9):
            num1 = i + 1
            num2 = j + 1
            result = num1 * num2
            if result < 10:
                row = row + f" {result} "
            else:
                row = row + f"{result} "
        print(row)


if __name__ == "__main__":
    main()
