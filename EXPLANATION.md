# Inventory Optimization RL: Deep Technical Explanation

This document provides a comprehensive breakdown of the code logic, mathematical foundations, and system architecture for the Reinforcement Learning (RL) Inventory Optimizer.

---

## 1. Data Processing (Walmart Dataset)

**Input:** `walmart_demand.csv` (contains 3,650 days of historical demand data).  
**Output:** A Python list of dictionaries, each containing `demand`, `price`, and `is_weekend` flag.  
**Working:**  
The script reads the CSV file and maps it to a list structure. This data acts as the "Environment" for the agent. The script uses a circular indexing method (`idx % N`) to allow the training loop to run for any number of episodes/steps across the dataset.

---

## 2. The Neural Network (`NumpyNet`)

**Input:** Current state vector $[inventory, today\_is\_wknd, tomorrow\_is\_wknd, days\_since\_wknd]$.  
**Output:** Q-Values for all 9 possible actions (Order 0, 5, 10... 40 units).  
**Working:**  
The `NumpyNet` is a multi-layer perceptron (MLP) built from scratch using NumPy. It consists of:
1.  **Forward Pass**: Multiplies inputs by weights and adds biases. It uses the **ReLU (Rectified Linear Unit)** activation function in hidden layers to introduce non-linearity, allowing the agent to learn complex patterns between weekday demand and order amounts.
2.  **Backpropagation**: Adjusts weights using the gradient of the error (Loss) to minimize the difference between predicted and actual "optimal" order values.

---

## 3. Deep Q-Learning (DQN) — Simplified Math

The AI uses a mathematical formula to decide: *"Is it better to order 0 units today and save money, or order 30 units to be safe for tomorrow?"*

### The "Golden Rule" (Bellman Equation)
Instead of just looking at today's profit, the AI calculates the **Total Long-Term Value** of an action.

**The Logic:**  
`Value of Ordering Today = (Today's Profit) + (Discounted Value of Tomorrow's Best State)`

**The Formula:**
> **Value(s, a) = Reward + γ × Max_Value(s')**

*   **Value(s, a)**: The score of taking action `a` (ordering stock) in current situation `s`.
*   **Reward**: Today's actual cash profit (Sales - Storage Costs).
*   **γ (Gamma)**: The "Patience Factor" (0.90). It tells the AI to care about tomorrow's safety.
*   **Max_Value(s')**: The best possible profit the AI expects to make tomorrow.

---

### How it "Learns" from Mistakes (MSE Loss)
The AI starts by guessing values randomly. It learns by comparing its **Guess** with the **Actual Reality**.

1.  **The Guess**: What the AI thought it would earn: `Q_predicted`.
2.  **The Reality (Target)**: The real reward it got + the value of the next day: `Q_target`.
3.  **The Error**: The difference between the two.

**The Math of Learning:**
> **Learning Step = (Q_target - Q_predicted)²**

By minimizing this error, the AI slowly adjusts its neural network "weights" until its "Guess" matches "Reality." When the guess is accurate, the AI is "Trained."

---

### Double DQN (The "Checking Twice" Logic)
To prevent the AI from being overly optimistic, we use two networks:
- **Network A (Decision Maker)**: Picks what it thinks is the best action.
- **Network B (The Judge)**: Evaluates how much that action is actually worth.

This "Second Opinion" ensures the AI doesn't accidentally think a risky move is a "sure win."

---

## 4. The RL Environment & State Engine

**Input:** Raw CSV data and current simulation state.  
**Output:** A normalized **State Vector** ready for the Neural Network.  
**Working:**  
The `get_state()` function translates raw environment variables into a format the AI can understand. It normalizes values (e.g., dividing inventory by 100) so that all inputs are roughly between 0 and 1. This prevents any single variable from overwhelming the weights of the neural network during training.

---

## 5. Reward System (The Strategy)

**Input:** Action taken (Order amount) and Demand result.  
**Output:** A numerical **Reward** value.  
**Working:**  
This is the "Law" of the simulation. It defines success:
- **Revenue**: `Sold Units * Price (+)`
- **Holding Cost**: `Ending Inventory * $2.0 (-)`
- **Stockout Penalty**: `Unmet Demand * $60.0 (--)`
- **Predictive Shaping**: Extra penalties are added during training if the agent is caught with low stock right before a weekend surge, teaching it to "Pre-stock" on Fridays.

---

## 6. Training & Output Loop

**Input:** 1,000 episodes of experience.  
**Output:** `model_weights.npy` and a JavaScript policy table.  
**Working:**  
The script runs the agent through thousands of simulated days. It uses **Experience Replay** (saving memories in a buffer and training on random samples) to break the correlation between consecutive days, which stabilizes the learning process. Once training is complete, it extracts the "Best Action" for every possible scenario and prints it as a JSON-like object for the web frontend to use.
