def caesar_encode(message, shift):
    result = []
    for char in message:
        if char.isupper():
            base = ord('A')
            result.append(chr((ord(char) - base + shift) % 26 + base))
        elif char.islower():
            base = ord('a')
            result.append(chr((ord(char) - base + shift) % 26 + base))
        else:
            result.append(char)
    return ''.join(result)

def caesar_decode(message, shift):
    return caesar_encode(message, -shift)

# Example:
encoded = caesar_encode("Hello, World!", 3)   # Khoor, Zruog!
decoded = caesar_decode(encoded, 3)           # Hello, World!