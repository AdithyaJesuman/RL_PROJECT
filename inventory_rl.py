import numpy as np
import random
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
import os
import csv

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# ==========================================
# 0. Load Walmart Dataset (Now with Weekends & Pricing)
# ==========================================
print("Loading Walmart Dataset...")
walmart_data = []

with open('walmart_demand.csv', 'r') as file:
    reader = csv.reader(file)
    next(reader) # skip header
    for row in reader:
        # day, demand, price, is_weekend
        walmart_data.append({
            "demand": int(row[1]),
            "price": float(row[2]),
            "is_weekend": float(row[3])
        })

# ==========================================
# 1. Setup Neural Network Brain
# ==========================================
actions = [0, 10, 20, 30] 
memory = []

# Neural Network Input is now TWO values: [Inventory Level, Is_Weekend]
# This makes the AI "accurate" to real world seasonal shifts
model = Sequential([
    Dense(16, input_dim=2, activation='relu'),
    Dense(len(actions), activation='linear')
])
model.compile(loss='mse', optimizer=Adam(learning_rate=0.005))

epsilon = 1.0     
gamma = 0.9       

# ==========================================
# 2. Main Training Loop
# ==========================================
print("Training Agent on Advanced Walmart Data...")
for episode in range(100):
    inventory = 20
    total_reward = 0
    
    for step in range(30):
        # Fetch current day's real data
        data = walmart_data[(episode * 30 + step) % len(walmart_data)]
        demand = data["demand"]
        price = data["price"]
        is_weekend = data["is_weekend"]

        # --------------------------------------------
        # STATE: Normalize inventory (0 to 1), and Weekend flag (0 or 1)
        # --------------------------------------------
        state = np.array([[inventory / 100.0, is_weekend]]) 
        
        # Act: Explore (random) OR Exploit (use Neural Network)
        if random.random() < epsilon:
            action_idx = random.randint(0, 3) 
        else:
            action_idx = np.argmax(model.predict(state, verbose=0)[0])
            
        order = actions[action_idx]
        
        # --- Environment Physics ---
        inventory = min(100, inventory + order)
        
        sold = min(demand, inventory)
        stockout_penalty = max(0, demand - inventory) * 5
        
        inventory -= sold                       
        holding_cost = inventory * 1            
        
        # Reward calculates dynamically with price column
        reward = (sold * price) - holding_cost - stockout_penalty
        
        # Peek at tomorrow to create the "next state"
        next_data = walmart_data[(episode * 30 + step + 1) % len(walmart_data)]
        next_state = np.array([[inventory / 100.0, next_data["is_weekend"]]])
        
        memory.append((state, action_idx, reward, next_state))
        
        # --- Deep Q-Learning Replay Routine ---
        if len(memory) > 32:
            batch = random.sample(memory, 32)
            states = np.vstack([x[0] for x in batch])
            next_states = np.vstack([x[3] for x in batch])
            
            Q_current = model.predict(states, verbose=0)
            Q_future = model.predict(next_states, verbose=0)
            
            for i, (_, a, r, _) in enumerate(batch):
                # Core Rule: Value = Immediate Reward + Target Future
                Q_current[i][a] = r + gamma * np.max(Q_future[i])
                
            model.fit(states, Q_current, verbose=0) 
            
        total_reward += reward
        
    epsilon *= 0.95 
    print(f"Episode: {episode + 1}, Reward: {total_reward}, Epsilon: {epsilon:.2f}")

# ==========================================
# 3. Test & Print the AI's Final Strategy
# ==========================================
print("\n--- Final Learned Strategy ---")
for is_wknd, day_name in [(0.0, "Weekday (Standard Demand)"), (1.0, "Weekend (Surge Demand!)")]:
    print(f"\nCondition: [{day_name}]:")
    for inv in [0, 20, 50, 80]:
        state = np.array([[inv / 100.0, is_wknd]])
        action_idx = np.argmax(model.predict(state, verbose=0)[0])
        print(f"  If Inventory is {inv:2} -> Agent Orders {actions[action_idx]:2}")
