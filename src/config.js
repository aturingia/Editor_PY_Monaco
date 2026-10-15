export const CLOUD_CONFIG = {
  googleDrive: {
    clientId: '',
    apiKey: '',
    scopes: 'https://www.googleapis.com/auth/drive.file'
  },
  dropbox: {
    appKey: '',
    redirectUri: window.location.origin + window.location.pathname
  }
};

export const PYODIDE_VERSION = '0.26.1';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export const STORAGE_KEY = 'pyeditor_pro_v6';
export const AUTOSAVE_DELAY = 800;

export const DROP_EXTENSIONS = [
  '.py', '.pyw', '.pyi',
  '.txt', '.md', '.json', '.toml', '.cfg', '.ini', '.yaml', '.yml', '.csv',
  '.html', '.css', '.js',
  '.zip'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_FILES_WARN = 100;

export const EXAMPLES = {
  hello: `print("¡Hola, mundo!")\n`,
  input: `nombre = await input_async("¿Cómo te llamas? ")\nedad = int(await input_async("¿Cuántos años tienes? "))\nprint(f"\\nHola {nombre}, el año que viene tendrás {edad + 1} años.")\n`,
  numpy: `import numpy as np\n\narr = np.random.randn(1000)\nprint(f"Media: {arr.mean():.4f}")\nprint(f"Desviación: {arr.std():.4f}")\n\nmatriz = np.random.randint(1, 10, (3, 3))\nprint("\\nMatriz 3x3:")\nprint(matriz)\nprint(f"Determinante: {np.linalg.det(matriz):.2f}")\n`,
  pandas: `import pandas as pd\n\ndf = pd.DataFrame({\n    'lenguaje': ['Python', 'JS', 'Rust', 'Go', 'C++'],\n    'año': [1991, 1995, 2010, 2009, 1985],\n    'popularidad': [98, 87, 45, 62, 55]\n})\n\nprint(df)\nprint("\\nEstadísticas:")\nprint(df['popularidad'].describe())\n`,
  plot: `import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 2 * np.pi, 200)\nfig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 3))\n\nax1.plot(x, np.sin(x), color='#0e639c')\nax1.set_title('sin(x)')\nax1.grid(True, alpha=0.3)\n\nax2.plot(x, np.cos(x), color='#dcdcaa')\nax2.set_title('cos(x)')\nax2.grid(True, alpha=0.3)\n\nplt.tight_layout()\nplt.show()\n`,
  async: `import asyncio\n\nasync def tarea(nombre, segundos):\n    print(f"[{nombre}] iniciando...")\n    await asyncio.sleep(segundos)\n    print(f"[{nombre}] completada en {segundos}s")\n    return nombre\n\nasync def main():\n    print("Ejecutando tareas concurrentes...")\n    r = await asyncio.gather(tarea("A", 0.5), tarea("B", 0.3), tarea("C", 0.7))\n    print(f"Resultados: {r}")\n\nawait main()\n`,
  multifile: `from utils import saludar, fibonacci\n\nprint(saludar("Mundo"))\nprint("Fibonacci(15):", fibonacci(15))\n`
};

export const EXAMPLES_MULTIFILE = {
  'main.py': EXAMPLES.multifile,
  'utils.py': `def saludar(nombre: str) -> str:\n    return f"¡Hola, {nombre}!"\n\ndef fibonacci(n: int) -> list[int]:\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n`
};