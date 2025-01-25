import { useState } from "react";
import theme from "../../styles/theme";
import CustomInput from "./ClassesInput";

interface ClassItemInterface {
	id: number;
	name: string;
	color: string;
}

function ClassesPanel() {
	const [classes, setClasses] = useState<ClassItemInterface[]>([
		{ id: 1, name: "Car", color: "#FFA500" }, // Exemplo inicial
		{ id: 2, name: "Grass", color: "#9370DB" },
		{ id: 3, name: "Tree", color: "#228B22" },
	]);

	const [newClassName, setNewClassName] = useState<string>("");

	const handleAddClass = () => {
		if (!newClassName.trim()) return; // Don't add empty classes
		const newClass: ClassItemInterface = {
			id: classes.length + 1,
			name: newClassName,
			color: currentColor,
		};
		setClasses([...classes, newClass]);
		setNewClassName(""); // Clear input
	};

	const getRandomColor = (): string => {
		// Color generator
		const letters = "0123456789ABCDEF";
		let color = "#";
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	};
	const [currentColor, setCurrentColor] = useState<string>(getRandomColor());
	const handleColorChange = () => {
		setCurrentColor(getRandomColor()); // Atualiza a cor
	};

	return (
		<div
			style={{
				background: theme.lightBackgroundColor,
				padding: "20px",
				borderRadius: "20px",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<h3
				style={{
					color: theme.primaryColor,
					fontSize: "28px",
					fontWeight: "bold",
				}}
			>
				Classes
			</h3>
			<div>
				{classes.map((item) => (
					<div
						key={item.id}
						style={{
							display: "flex",
							alignItems: "center",
							marginBottom: "10px",
							gap: "10px",
							minHeight: "38px",
							background: theme.backgroundColor,
							borderRadius: "10px",
						}}
					>
						<div
							style={{
								width: "10px",
								height: "38px",
								backgroundColor: item.color,
								borderRadius: "10px 0px 0px 10px",
							}}
						></div>
						<span style={{ color: theme.textColor }}>{item.name}</span>
					</div>
				))}
			</div>
			<div
				style={{
					marginTop: "20px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<CustomInput
					placeholder="Type a class"
					value={newClassName}
					onChange={(e) => setNewClassName(e.target.value)}
					currentColor={currentColor}
					onReloadColor={handleColorChange}
				/>
				<button
					onClick={handleAddClass}
					style={{
						backgroundColor: theme.primaryColor,
						color: "#fff",
						width: "30px",
						height: "30px",
						border: "none",
						borderRadius: "15px",
						cursor: "pointer",
						boxShadow: "none",
					}}
				>
					+
				</button>
			</div>
		</div>
	);
}

export default ClassesPanel;
