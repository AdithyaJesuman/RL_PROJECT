import csv
import random
import math

with open('walmart_demand.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['day', 'demand', 'price', 'is_weekend'])
    
    # Generate an accurate, longer 365-day dataset
    for day in range(1, 366):
        # Weekends are on day 5 and 6 of a 7-day cycle
        is_weekend = 1 if (day % 7 == 5 or day % 7 == 6) else 0
        
        base_demand = 13
        if is_weekend:
            # Massive surge on weekends
            base_demand += 10
            
        # Add smooth seasonality shifts (e.g. holiday rushes simulating a sine wave)
        seasonality = int(5 * math.sin(day / 30.0))
        
        # Add pure randomness / noise
        noise = random.randint(-3, 3)
        
        final_demand = max(5, base_demand + seasonality + noise)
        
        writer.writerow([day, final_demand, 10, is_weekend])

print("365-day Walmart dataset successfully generated.")
