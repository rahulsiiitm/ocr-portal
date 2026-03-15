clean_words = set()

with open("hi_IN.dic", "r", encoding="utf-8") as f:
    
    next(f)  # skip first line (word count)

    for line in f:
        word = line.split("/")[0].strip()
        if word:
            clean_words.add(word)

with open("hindi.txt", "w", encoding="utf-8") as out:
    
    for w in sorted(clean_words):
        out.write(w + "\n")

print("Dictionary cleaned!")
print("Total words:", len(clean_words))