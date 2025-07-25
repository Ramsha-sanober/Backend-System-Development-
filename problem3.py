def combine_elements(lista, listb):
    result = []
    idx_a, idx_b = 0, 0
    while idx_a < len(lista) and idx_b < len(listb):
        a = lista[idx_a]
        b = listb[idx_b]
        l1, r1 = a['positions']
        l2, r2 = b['positions']
        len1, len2 = r1 - l1, r2 - l2
        overlap = max(0, min(r1, r2) - max(l1, l2))
        if overlap > 0 and (overlap > len1 / 2 or overlap > len2 / 2):
            combined = {
                'positions': [min(l1, l2), max(r1, r2)],
                'values': a['values'] + b['values']
            }
            result.append(combined)
            idx_a += 1
            idx_b += 1
        elif l1 < l2:
            result.append(a)
            idx_a += 1
        else:
            result.append(b)
            idx_b += 1
    for i in range(idx_a, len(lista)):
        result.append(lista[i])
    for i in range(idx_b, len(listb)):
        result.append(listb[i])
    result.sort(key=lambda x: x['positions'][0])
    return result

# Example:
l1 = [{"positions": [0, 5], "values": ["a"]}]
l2 = [{"positions": [4, 10], "values": ["b"]}]
combined = combine_elements(l1, l2)
# Will combine if >50% overlap, else append both