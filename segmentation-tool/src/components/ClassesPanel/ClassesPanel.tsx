import { useState } from "react";
import theme from "../../styles/theme";
import CustomInput from "./ClassesInput";

interface ClassItemInterface {
	id: number;
	name: string;
	color: string;
}

// Tipo das props que o ClassesPanel espera
interface ClassesPanelProps {
	classes: ClassItemInterface[]; // <-- array vindo do pai
	selectedClassId: number | null;
	onClassSelect: (classItem: ClassItemInterface) => void;
	onAddClass: (className: string, color: string) => void;
}

function ClassesPanel({
	classes,
	selectedClassId,
	onClassSelect,
	onAddClass,
}: ClassesPanelProps) {
	const [newClassName, setNewClassName] = useState<string>("");

	function handleAddClassClick() {
		if (!newClassName.trim()) return;
		onAddClass(newClassName, currentColor); // chama callback do pai
		setNewClassName(""); // reseta input
		handleColorChange(); // gera nova cor
	}

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
			<div style={{ overflowY: "auto", flexGrow: 1, marginBottom: "20px" }}>
				{classes.map((item) => {
					// Verifica se esta classe é a atualmente selecionada
					const isSelected = item.id === selectedClassId;
					return (
						<div
							key={item.id}
							onClick={() => onClassSelect(item)}
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: "10px",
								gap: "10px",
								minHeight: "38px",
								borderRadius: "10px",
								backgroundColor: theme.backgroundColor,
								cursor: "pointer",
								border: isSelected ? `2px solid ${item.color}` : "none",
							}}
						>
							<div
								style={{
									width: "10px",
									height: "38px",
									backgroundColor: item.color,
									borderRadius: "10px 0px 0px 10px",
								}}
							/>
							<span style={{ color: theme.textColor }}>{item.name}</span>
						</div>
					);
				})}
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
					onClick={handleAddClassClick}
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
