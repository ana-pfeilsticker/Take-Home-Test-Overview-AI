import React from "react";
import { FaPaintBrush, FaShapes, FaEraser, FaUndoAlt } from "react-icons/fa";
import { IoShareOutline } from "react-icons/io5";

const ToolBar: React.FC = () => {
	const handleExport = () => {
		console.log("Exporting data...");
		// Lógica de exportação será adicionada aqui no futuro
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "space-between",
				height: "100%",
				width: "60px",
				backgroundColor: "#fff",
				borderRadius: "10px",
				boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				padding: "10px 0",
			}}
		>
			{/* Menu de ferramentas */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "20px",
				}}
			>
				<button
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "20px",
						color: "#5E4AE3",
					}}
				>
					<FaPaintBrush />
				</button>
				<button
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "20px",
						color: "#5E4AE3",
					}}
				>
					<FaShapes />
				</button>
				<button
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "20px",
						color: "#5E4AE3",
					}}
				>
					<FaEraser />
				</button>
				<button
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						fontSize: "20px",
						color: "#5E4AE3",
					}}
				>
					<FaUndoAlt />
				</button>
			</div>

			{/* Botão de exportação */}
			<button
				onClick={handleExport}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "40px",
					height: "40px",
					backgroundColor: "#5E4AE3",
					border: "none",
					borderRadius: "20px",
					color: "#fff",
					cursor: "pointer",
					boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				}}
			>
				<IoShareOutline size={20} />
			</button>
		</div>
	);
};

export default ToolBar;
