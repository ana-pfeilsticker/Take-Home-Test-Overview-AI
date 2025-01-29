import { useEffect, useState } from "react";
import theme from "../../styles/theme";
import CustomInput from "./ClassesInput";
import "./ClassesPanel.css";
import { CgClose } from "react-icons/cg";

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
	const [isOpen, setIsOpen] = useState(true);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 800) {
				setIsOpen(true); // em telas grandes, sempre aberto
			} else {
				setIsOpen(false);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

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
		<div style={{ height: isOpen ? "100%" : "fit-content" }}>
			<button
				style={{
					position: "absolute",
					top: 10,
					left: 10,
					zIndex: 1000,
					display: window.innerWidth < 800 && !isOpen ? "flex" : "none",
					alignItems: "center",
					gap: "2px",
					padding: "10px 20px",
					backgroundColor: "#5E4AE3",
					color: "#fff",
					borderRadius: "8px",
					border: "none",
					cursor: "pointer",
				}}
				onClick={() => setIsOpen(!isOpen)}
			>
				{" "}
				Classes
			</button>
			{isOpen && (
				<div
					className={`panel-container ${isOpen ? "open" : ""}`}
					style={{
						background: theme.lightBackgroundColor,
						height: "100%",
						borderRadius: "20px",
						padding: "20px",
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
					}}
				>
					<button
						style={{
							position: "absolute",
							top: 10,
							left: 10,
							zIndex: 1000,
							display: window.innerWidth < 800 ? "flex" : "none",
							alignItems: "center",
							gap: "2px",
							color: "#5E4AE3",
							border: "none",
							cursor: "pointer",
							fontSize: "20px",
						}}
						onClick={() => setIsOpen(!isOpen)}
					>
						{" "}
						<CgClose />
					</button>
					<h3
						style={{
							color: theme.primaryColor,
							fontSize: "28px",
							fontWeight: "bold",
							marginTop: "30px",
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
			)}
		</div>
	);
}

export default ClassesPanel;
