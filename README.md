

# **🖌 Segmentation Tool**

## **📌 About the Project**
The **Segmentation Tool** is an interactive annotation tool that allows users to segment objects in images using a brush, polygons, and an eraser. The main goal is to create annotations in the **COCO format** for training computer vision models.

---

## **🚀 How to Run the Project**

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/your-username/segmentation-tool.git
```

### **2️⃣ Navigate to the Project Directory**
```sh
cd segmentation-tool
```

### **3️⃣ Install Dependencies**
```sh
npm install
```

### **4️⃣ Start the Frontend**
```sh
npm run dev
```
This will start the **frontend** in development mode.

### **5️⃣ Run the API (Backend)**
Open a new terminal, navigate to the `root` folder, install dependencies, and start the Python server:
```sh
pip install -r requirements.txt
python api.py
```
Now the backend will be running on port `5002` to validate COCO files.

---

## **🖥️ How to Use the Tool**

### **1️⃣ Upload an Image**
- When you open the tool, you will see an **"Upload Image"** button.
- Click it and select an image from your computer.
- The image will be loaded onto the canvas and will be ready for annotation.

  ![image](https://github.com/user-attachments/assets/f9ee486e-69d4-4952-a4ec-40687f080d59)
![image](https://github.com/user-attachments/assets/76acf776-cee6-4ca6-9cb1-1d8dca3efb5c)


### **2️⃣ Class Selection**
- On the left panel, you can **add new classes** (with a name and a color).
- Click on a class to select it and start drawing with that category.
- ![image](https://github.com/user-attachments/assets/bc2561f8-9fee-4d2f-8b37-a9426089e36e)
![image](https://github.com/user-attachments/assets/5b861448-17cc-4176-bb11-547c66f00f09)


### **3️⃣ Annotation Tools**
- **🖌 Brush**: Click the brush icon to activate freehand drawing mode. Adjust the brush width as needed.
  ![image](https://github.com/user-attachments/assets/e3281fb1-4fc0-4e96-a3f8-91f1c621b2b6)

- **📐 Polygon Mode**: Click the polygon icon and add points by clicking on the canvas. To complete the polygon, click near the first point.
  ![image](https://github.com/user-attachments/assets/25a67a42-68d2-41c6-9c40-c5b2dcb29c92)

- **🧽 Eraser**: Click the eraser icon and select an object on the canvas to remove it.

### **4️⃣ Canvas Controls**
- **⏪ Undo**: Reverts the last action.
- **📤 Export COCO**: Exports annotations in COCO format for use in AI models.
---

📧 **Contact**: [anapfeilsticker@gmail.com](mailto:anapfeilsticker@gmail.com)
You can check some overview of the software in this youtube video https://youtu.be/02XMK5OZftI
