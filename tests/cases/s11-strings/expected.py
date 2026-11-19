def main():
    line = "  Hello, Kururi  "
    text = line.strip()
    print(text.upper())
    print(text.lower())
    if ("Kururi" in text):
        print("Kururi が入っています")
    if text.startswith("Hello") and not text.endswith("!"):
        print("あいさつで始まります")
    print(text.find("K"))
    print(text.replace("Kururi", "世界"))
    words = text.split(", ")
    print(len(words))
    print("true" if ("Hello" in words) else "false")
    print("-".join(words))


if __name__ == "__main__":
    main()
