import React from "react";
import theme from "../../styles/theme";
import { TbReload } from "react-icons/tb";

interface CustomInputProps {
	placeholder: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	currentColor: string;
	onReloadColor: () => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
	placeholder,
	value,
	onChange,
	currentColor,
	onReloadColor,
}) => {
	const lightenColor = (hex: string, amount: number): string => {
		// Remove o "#" se existir
		const sanitizedHex = hex.replace("#", "");
		// Divide em partes (vermelho, verde, azul)
		const r = Math.min(
			255,
			parseInt(sanitizedHex.substring(0, 2), 16) + amount
		);
		const g = Math.min(
			255,
			parseInt(sanitizedHex.substring(2, 4), 16) + amount
		);
		const b = Math.min(
			255,
			parseInt(sanitizedHex.substring(4, 6), 16) + amount
		);
		// Retorna em formato hexadecimal
		return `rgb(${r}, ${g}, ${b})`;
	};
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				width: " 85%",
				backgroundColor: theme.backgroundColor,
				borderRadius: "10px",
				overflow: "hidden",
				height: "38px",
			}}
		>
			{/* Ícone e Cor */}
			<div
				onClick={onReloadColor}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "15%",
					backgroundColor: currentColor, // Cor de fundo
					cursor: "pointer",
					height: "100%",
				}}
			>
				<TbReload
					style={{
						color: lightenColor(currentColor, 99),
						fontSize: "16px",
					}}
				/>
			</div>

			{/* Input de Texto */}
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				style={{
					width: "80%",
					border: "none",
					outline: "none",
					padding: "5px",
					fontSize: "16px",
					color: theme.textColor,
					backgroundColor: "transparent",
				}}
			/>
		</div>
	);
};

export default CustomInput;
