import React, { useRef, useEffect, useState } from "react";
import * as fabric from "fabric";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { validateCOCOOnServer } from "../../services/cocoService";
import ToolBar from "../Toolbar/Toobar";

interface ClassItemInterface {
	id: number;
	name: string;
	color: string;
}

interface CanvasAreaProps {
	selectedClass: ClassItemInterface | null;
	allClasses: ClassItemInterface[];
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
	selectedClass,
	allClasses,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

	// Pilhas de Undo/Redo
	const undoStack = useRef<string[]>([]);
	const redoStack = useRef<string[]>([]);

	// Estados principais
	const [isImageUploaded, setIsImageUploaded] = useState(false);
	const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

	// Brush config
	const [brushWidth, setBrushWidth] = useState(5);

	// Modo brush, polígono e borracha
	const [isBrushing, setIsBrushing] = useState(true);
	const [isPolygonMode, setIsPolygonMode] = useState(false);
	const [isEraserMode, setIsEraserMode] = useState(false);

	// Refs para o Polígono
	const pointArray = useRef<fabric.Circle[]>([]);
	const lineArray = useRef<fabric.Line[]>([]);
	const activeLine = useRef<fabric.Line | null>(null);
	const activeShape = useRef<fabric.Polygon | null>(null);

	// ============================
	// 1) Inicialização do Canvas
	// ============================
	useEffect(() => {
		if (!canvasRef.current || !isImageUploaded) return;

		const canvasDiv = document.getElementById("canvas-div");
		if (!canvasDiv) {
			console.error("Elemento canvas-div não encontrado!");
			return;
		}

		const width = canvasDiv.clientWidth;
		const height = canvasDiv.clientHeight;

		const canvas = new fabric.Canvas(canvasRef.current, {
			isDrawingMode: true,
			selection: false,
			backgroundColor: "transparent",
			width,
			height,
		});
		fabricCanvasRef.current = canvas;

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

		// Configurar o brush (para quando o componente inicia)
		console.log(canvas.freeDrawingBrush);
		if (canvas.freeDrawingBrush) {
			// se não houver selectedClass, use cor default "#000"
			const brushColor = selectedClass?.color || "#000000";
			canvas.freeDrawingBrush.color = brushColor;
			canvas.freeDrawingBrush.width = brushWidth;
		}

		// Carregar último estado se existir
		if (undoStack.current.length > 0) {
			const lastState = undoStack.current[undoStack.current.length - 1];
			canvas.loadFromJSON(lastState, () => {
				canvas.renderAll();
				canvas.forEachObject((obj) => obj.setCoords());
			});
		}

		// Salvar estado em Undo
		const saveState = () => {
			const currentState = JSON.stringify(canvas.toJSON());
			if (
				undoStack.current.length === 0 ||
				undoStack.current[undoStack.current.length - 1] !== currentState
			) {
				undoStack.current.push(currentState);
				redoStack.current = [];
			}
		};
		canvas.on("object:modified", saveState);

		canvas.on("mouse:down", () => console.log("Mouse down (Fabric)"));
		canvas.on("mouse:move", () => console.log("Mouse move (Fabric)"));
		canvas.on("mouse:up", () => console.log("Mouse up (Fabric)"));
		// Sempre que cria um path (brush), definimos a cor e as "props"
		canvas.on("path:created", (e) => {
			const pathObj = e.path;
			if (selectedClass) {
				pathObj.set({
					fill: selectedClass.color,
					// Se brush é fill, pode ser fill: selectedClass.color,
				});

				// Armazena info da classe
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(pathObj as any).data = {
					classId: selectedClass.id,
					className: selectedClass.name,
					classColor: selectedClass.color,
				};
			}
			// Salva estado
			saveState();
		});

		// Cleanup ao desmontar
		return () => {
			canvas.dispose();
		};
	}, [isImageUploaded]);

	// =============================
	// 2) Atualiza Brush ao mudar selectedClass ou brushWidth
	// =============================
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;
		if (canvas.freeDrawingBrush) {
			// se não houver selectedClass, default "#000"
			const brushColor = selectedClass?.color || "#000000";
			canvas.freeDrawingBrush.color = brushColor;
			canvas.freeDrawingBrush.width = brushWidth;
		}
	}, [selectedClass, brushWidth]);

	// =============================
	// 3) Modo Polígono
	// =============================
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isPolygonMode) {
			canvas.isDrawingMode = false;
			cancelPolygonDrawing();

			function handlePolygonLocal(options: fabric.IEvent<MouseEvent>) {
				if (!canvas) return;
				const pointer = canvas.getPointer(options.e);
				const zoom = canvas.getZoom();

				if (pointArray.current.length > 0) {
					const firstCircle = pointArray.current[0];
					const dx = (firstCircle.left ?? 0) - pointer.x / zoom;
					const dy = (firstCircle.top ?? 0) - pointer.y / zoom;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < 10) {
						finalizePolygonLocal();
						return;
					}
				}

				// Cria o círculo (ponto)
				const circle = new fabric.Circle({
					radius: 5,
					fill: selectedClass?.color,
					stroke: "#333333",
					strokeWidth: 0.5,
					left: pointer.x / zoom,
					top: pointer.y / zoom,
					selectable: false,
					hasBorders: false,
					hasControls: false,
					originX: "center",
					originY: "center",
				});

				// Linha
				const line = new fabric.Line(
					[
						pointer.x / zoom,
						pointer.y / zoom,
						pointer.x / zoom,
						pointer.y / zoom,
					],
					{
						strokeWidth: 2,
						stroke: "#999999",
						selectable: false,
						hasBorders: false,
						hasControls: false,
						evented: false,
					}
				);

				// Se já existe polígono temporário
				if (activeShape.current) {
					const pos = canvas.getPointer(options.e);
					const polyPoints = activeShape.current.get("points") || [];
					polyPoints.push({ x: pos.x, y: pos.y });

					const newPolygon = new fabric.Polygon(polyPoints, {
						stroke: "#333",
						strokeWidth: 1,
						fill: "#cccccc",
						opacity: 0.2,
						selectable: false,
						hasBorders: false,
						hasControls: false,
						evented: false,
					});
					canvas.remove(activeShape.current);
					canvas.add(newPolygon);
					activeShape.current = newPolygon;
					canvas.renderAll();
				} else {
					// Primeiro polígono “temporário”
					const polyPoint = [{ x: pointer.x, y: pointer.y }];
					const polygon = new fabric.Polygon(polyPoint, {
						stroke: "#333",
						strokeWidth: 1,
						fill: "#cccccc",
						opacity: 0.2,
						selectable: false,
						hasBorders: false,
						hasControls: false,
						evented: false,
					});
					activeShape.current = polygon;
					canvas.add(polygon);
				}

				activeLine.current = line;
				pointArray.current.push(circle);
				lineArray.current.push(line);

				canvas.add(line);
				canvas.add(circle);
				canvas.selection = false;
			}

			function finalizePolygonLocal() {
				const canvas = fabricCanvasRef.current;
				if (!canvas || !activeShape.current) return;

				const polyPoints = (activeShape.current.get("points") || []).map(
					(p) => ({
						x: p.x,
						y: p.y,
					})
				);

				// Remove pontos e linhas temporárias
				pointArray.current.forEach((c) => canvas.remove(c));
				lineArray.current.forEach((l) => canvas.remove(l));
				if (activeLine.current) {
					canvas.remove(activeLine.current);
					activeLine.current = null;
				}
				canvas.remove(activeShape.current);

				// Cria polígono final
				const polygon = new fabric.Polygon(polyPoints, {
					stroke: "#333333",
					strokeWidth: 1,
					// Se tiver classe selecionada, use a cor
					fill: selectedClass?.color || "#000000",
					opacity: 1,
					selectable: true,
					hasBorders: true,
					hasControls: true,
					evented: true,
				});

				// Armazena no data a info da classe
				if (selectedClass) {
					polygon.data = {
						classId: selectedClass.id,
						className: selectedClass.name,
						classColor: selectedClass.color,
					};
				}

				canvas.add(polygon);

				activeShape.current = null;
				pointArray.current = [];
				lineArray.current = [];

				canvas.selection = true;
				saveStateManualmente();
				message.success("Polígono finalizado!");
			}

			canvas.on("mouse:down", handlePolygonLocal);

			return () => {
				canvas.off("mouse:down", handlePolygonLocal);
				cancelPolygonDrawing();
			};
		} else {
			const canvas = fabricCanvasRef.current;
			if (!canvas) return;
			if (!isEraserMode) {
				canvas.isDrawingMode = isBrushing;
			}
		}
	}, [isPolygonMode, isBrushing, isEraserMode, selectedClass]);

	// ============================
	// 4) Modo Borracha
	// ============================
	useEffect(() => {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isEraserMode) {
			canvas.isDrawingMode = false;
			cancelPolygonDrawing();

			function handleEraserLocal(options: fabric.IEvent<MouseEvent>) {
				if (!canvas) return;
				const target = options.target;
				if (target) {
					canvas.remove(target);
					canvas.discardActiveObject();
					canvas.requestRenderAll();
					saveStateManualmente();
				}
			}

			canvas.on("mouse:down", handleEraserLocal);

			return () => {
				canvas.off("mouse:down", handleEraserLocal);
			};
		} else {
			if (!isPolygonMode) {
				canvas.isDrawingMode = isBrushing;
			}
		}
	}, [isEraserMode, isPolygonMode, isBrushing]);

	// ============================
	// Funções Auxiliares
	// ============================
	function cancelPolygonDrawing() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		pointArray.current.forEach((c) => canvas.remove(c));
		lineArray.current.forEach((l) => canvas.remove(l));
		if (activeLine.current) {
			canvas.remove(activeLine.current);
			activeLine.current = null;
		}
		if (activeShape.current) {
			canvas.remove(activeShape.current);
			activeShape.current = null;
		}
		pointArray.current = [];
		lineArray.current = [];
		canvas.renderAll();
	}

	function saveStateManualmente() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		const currentState = JSON.stringify(canvas.toJSON());
		if (
			undoStack.current.length === 0 ||
			undoStack.current[undoStack.current.length - 1] !== currentState
		) {
			undoStack.current.push(currentState);
			redoStack.current = [];
		}
	}

	function undo() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (undoStack.current.length > 1) {
			const lastState = undoStack.current.pop();
			if (lastState) {
				redoStack.current.push(lastState);
			}
			const previousState = undoStack.current[undoStack.current.length - 1];
			canvas.loadFromJSON(previousState).then(() => {
				canvas.renderAll();
			});
		} else {
			message.warning("Nada para desfazer.");
		}
	}

	// ============================
	// Upload de Imagem
	// ============================
	function handleImageUpload(file: File) {
		const reader = new FileReader();
		reader.onload = (e) => {
			if (!e.target?.result) {
				console.error("Erro ao carregar a imagem.");
				message.error("Erro ao carregar a imagem.");
				return;
			}
			setBackgroundImage(e.target.result as string);
			setIsImageUploaded(true);
			message.success("Imagem de fundo definida com sucesso!");
		};
		reader.onerror = () => {
			console.error("Erro ao processar o arquivo.");
			message.error("Erro ao processar o arquivo.");
		};
		reader.readAsDataURL(file);
		return false;
	}

	// ============================
	// Botões
	// ============================
	function toggleBrushing() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isBrushing) {
			setIsBrushing(false);
			canvas.isDrawingMode = false;
		} else {
			setIsBrushing(true);
			setIsPolygonMode(false);
			setIsEraserMode(false);
			canvas.isDrawingMode = true;
		}
	}

	function togglePolygonMode() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isPolygonMode) {
			setIsPolygonMode(false);
		} else {
			setIsPolygonMode(true);
			setIsBrushing(false);
			setIsEraserMode(false);
			canvas.isDrawingMode = false;
		}
	}

	function toggleEraserMode() {
		const canvas = fabricCanvasRef.current;
		if (!canvas) return;

		if (isEraserMode) {
			setIsEraserMode(false);
		} else {
			setIsEraserMode(true);
			setIsBrushing(false);
			setIsPolygonMode(false);
			canvas.isDrawingMode = false;
		}
	}
	// ----------------------------
	// buildCOCOJSON, polygonArea etc.
	// ----------------------------
	function polygonArea(points: fabric.Point[]) {
		let area = 0;
		for (let i = 0; i < points.length; i++) {
			const j = (i + 1) % points.length;
			area += points[i].x * points[j].y - points[j].x * points[i].y;
		}
		return Math.abs(area / 2);
	}

	function buildCOCOJSON() {
		const canvas = fabricCanvasRef.current!;
		const width = canvas.getWidth();
		const height = canvas.getHeight();

		const cocoJSON = {
			info: {
				description: "Example dataset",
				url: "http://localhost:5173", // Necessário
				version: "1.0",
				year: 2025,
				contributor: "User",
				date_created: new Date().toISOString(),
			},
			licenses: [
				{
					url: "http://opensource.org/licenses/MIT",
					id: 1,
					name: "MIT",
				},
			],
			images: [
				{
					license: 1,
					file_name: "uploaded_image.jpg",
					coco_url: "http://somewhere.com/coco", // OBRIGATÓRIO
					height,
					width,
					date_captured: "2025-01-28", // OBRIGATÓRIO
					flickr_url: "http://someflickr.com", // OBRIGATÓRIO
					id: 1,
				},
			],
			annotations: [] as any[],
			categories: allClasses.map((cls) => ({
				supercategory: "object", // OBRIGATÓRIO no schema
				id: cls.id,
				name: cls.name,
			})),
		};
		let annotationId = 1;

		canvas.getObjects().forEach((obj) => {
			const catId = (obj as any).data?.classId || 0;

			if (obj.type === "polygon") {
				const poly = obj as fabric.Polygon;
				const points = poly.points || [];
				const segArr: number[] = [];
				points.forEach((p) => segArr.push(p.x, p.y));
				const segmentation = [segArr];

				const xs = points.map((p) => p.x);
				const ys = points.map((p) => p.y);
				const minX = Math.min(...xs);
				const maxX = Math.max(...xs);
				const minY = Math.min(...ys);
				const maxY = Math.max(...ys);
				const bbox = [minX, minY, maxX - minX, maxY - minY];

				const area = polygonArea(points);

				cocoJSON.annotations.push({
					id: annotationId++,
					image_id: 1,
					category_id: catId,
					segmentation,
					area,
					bbox,
					iscrowd: 0,
				});
			} else if (obj.type === "path") {
				const bound = obj.getBoundingRect();
				const bbox = [bound.left, bound.top, bound.width, bound.height];
				const area = bound.width * bound.height;

				cocoJSON.annotations.push({
					id: annotationId++,
					image_id: 1,
					category_id: catId,
					segmentation: [],
					area,
					bbox,
					iscrowd: 0,
				});
			}
		});

		return cocoJSON;
	}

	function downloadJson(jsonStr: string, filename: string) {
		const blob = new Blob([jsonStr], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	async function exportAndValidateCOCO() {
		if (!fabricCanvasRef.current) return;

		const cocoJSON = buildCOCOJSON();
		// Valida no servidor
		console.log(cocoJSON);
		const { status, data } = await validateCOCOOnServer(cocoJSON);
		if (status === 200) {
			console.log("Validação ok no servidor!");
			downloadJson(JSON.stringify(cocoJSON, null, 2), "annotations.json");
		} else {
			console.error("Validação falhou:", data);
			message.error("Validação falhou: " + JSON.stringify(data));
		}
	}

	// ============================
	// Render
	// ============================
	return (
		<div
			style={{
				display: "flex",
				height: "100%",
				width: "100%",
				justifyContent: "space-between",
			}}
		>
			<div
				id="canvas-div"
				style={{
					height: "100%",
					width: "90%",
					borderRadius: "20px",
					display: "flex",
					justifyContent: "center",
					position: "relative",
					backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			>
				{!isImageUploaded ? (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Upload beforeUpload={handleImageUpload} showUploadList={false}>
							<button
								style={{
									padding: "10px 20px",
									backgroundColor: "#5E4AE3",
									color: "#fff",
									borderRadius: "8px",
									border: "none",
									cursor: "pointer",
									marginBottom: "10px",
								}}
							>
								<UploadOutlined /> Upload Image
							</button>
						</Upload>
						<p>Upload a image to make anotations</p>
					</div>
				) : (
					<>
						<canvas
							ref={canvasRef}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: "100%",
							}}
						/>
					</>
				)}
			</div>
			<ToolBar
				onToggleBrush={toggleBrushing}
				onTogglePolygon={togglePolygonMode}
				onToggleEraser={toggleEraserMode}
				onUndo={undo}
				onExport={exportAndValidateCOCO}
				brushWidth={brushWidth}
				onBrushWidthChange={(val) => setBrushWidth(val)}
				isBrushingActive={isBrushing}
				isPolygonActive={isPolygonMode}
				isEraserActive={isEraserMode}
			/>
		</div>
	);
};

export default CanvasArea;
