def minimize_loss(prices):
    indexed_prices = list(enumerate(prices))
    sorted_prices = sorted(indexed_prices, key=lambda x: x[1], reverse=True)
    min_loss = float('inf')
    best_buy, best_sell = -1, -1
    price_indices = {p: i for i, p in enumerate(prices)}
    for i in range(len(sorted_prices)):
        for j in range(i+1, len(sorted_prices)):
            price_high, idx_high = sorted_prices[i][1], sorted_prices[i][0]
            price_low, idx_low = sorted_prices[j][1], sorted_prices[j][0]
            if idx_high < idx_low and price_high > price_low:
                loss = price_high - price_low
                if 0 < loss < min_loss:
                    min_loss = loss
                    best_buy, best_sell = idx_high+1, idx_low+1
    return {'buy_year': best_buy, 'sell_year': best_sell, 'min_loss': min_loss}

# Example:
prices = [20, 15, 7, 2, 13]
print(minimize_loss(prices))
# Output: {'buy_year': 2, 'sell_year': 5, 'min_loss': 2}