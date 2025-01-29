import { ConfigProvider, App as AntdApp } from "antd";
import Layout, { Content } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import theme from "./styles/theme";
import ClassesPanel from "./components/ClassesPanel/ClassesPanel";
import CanvasArea from "./components/Canvas/CanvasArea";
import ToolBar from "./components/Toolbar/Toobar";
import { useState } from "react";

export interface ClassItemInterface {
	id: number;
	name: string;
	color: string;
}
function App() {
	const [classes, setClasses] = useState<ClassItemInterface[]>([
		{ id: 1, name: "Car", color: "#FFA500" },
		{ id: 2, name: "Grass", color: "#9370DB" },
		{ id: 3, name: "Tree", color: "#228B22" },
	]);
	const [selectedClass, setSelectedClass] = useState<ClassItemInterface | null>(
		null
	);

	function handleAddClass(newClassName: string, color: string) {
		const newClass: ClassItemInterface = {
			id: classes.length + 1,
			name: newClassName,
			color,
		};
		setClasses([...classes, newClass]);
	}

	const handleClassSelect = (cls: ClassItemInterface) => {
		setSelectedClass(cls);
	};
	return (
		<ConfigProvider
			theme={{
				token: {
					colorBgBase: theme.backgroundColor,
					fontFamily: "'Montserrat', sans-serif",
				},
			}}
		>
			<AntdApp>
				<Layout style={{ height: "100vh", background: "#FBFBFB" }}>
					<Sider
						width="25%"
						style={{
							background: theme.backgroundColor,
							padding: "20px",
						}}
					>
						<ClassesPanel
							classes={classes} // passa o array
							selectedClassId={selectedClass?.id ?? null}
							onClassSelect={handleClassSelect}
							onAddClass={handleAddClass}
						/>
					</Sider>
					<Content
						style={{
							padding: "20px",
							gap: "25px",
							display: "flex",
						}}
					>
						<div
							style={{
								height: "100%",
								width: "100%",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<CanvasArea selectedClass={selectedClass} allClasses={classes} />
						</div>
					</Content>
				</Layout>
			</AntdApp>
		</ConfigProvider>
	);
}

export default App;
