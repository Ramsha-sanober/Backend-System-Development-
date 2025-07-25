def indian_currency_format(number):
    s = f"{number:.10f}".rstrip('0').rstrip('.') if '.' in f"{number}" else f"{number}"
    if '.' in s:
        int_part, dec_part = s.split('.')
    else:
        int_part, dec_part = s, ''
    n = len(int_part)
    if n <= 3:
        formatted = int_part
    else:
        last3 = int_part[-3:]
        rest = int_part[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        formatted = ','.join(parts + [last3])
    if dec_part:
        formatted += '.' + dec_part
    return formatted

# Example:
print(indian_currency_format(123456.7891)) # 1,23,456.7891
print(indian_currency_format(12345678.9))  # 1,23,45,678.9