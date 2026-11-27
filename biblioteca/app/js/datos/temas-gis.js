// Copia del catálogo de temas sembrado por Gestión Pedagógica en GIS
// (public/index.html: MAPA_MAESTRO y GP_CAMPO, commit 1accd27). Sirve para crear
// el árbol de temas inicial con un vínculo a GIS. No se leen datos de alumnos.
// Si César cambió sus temas en GIS, estos pueden no coincidir: el vínculo es por materia + nombre.

export const MAPA_MAESTRO = {
  'Lenguajes / Español':['Identidad y autobiografía','Descripción de personas y lugares','Estructura de la oración','Ortografía básica','Tipos de texto','Cuentos y leyendas','Noticias','Entrevista','Carta y correo','Instructivos','Reglamentos','Exposición oral','Debate','Poesía','Textos argumentativos','Investigación y fuentes'],
  'Matemáticas':['Operaciones básicas','Números enteros','Fracciones','Decimales','Porcentajes','Proporcionalidad','Regla de tres','Potencias','Raíces','Álgebra básica','Ecuaciones','Perímetro y área','Cuerpos geométricos','Estadística','Gráficas','Probabilidad','Educación financiera'],
  'Biología / Ciencias de la Vida':['Características de los seres vivos','La célula','Seres unicelulares y pluricelulares','Clasificación de los seres vivos','Reinos de los seres vivos','Bacterias','Protistas','Hongos','Plantas','Animales','Nutrición','Respiración','Reproducción','Ecosistemas','Cadenas alimentarias','Cuerpo humano','Aparatos y sistemas','Alimentación y salud','Genética básica'],
  'Física y Química':['La ciencia y los experimentos','Medición y unidades','Materia','Estados de la materia','Sustancias y mezclas','Átomos y moléculas','Elementos y tabla periódica','Cambios físicos y químicos','Ácidos, bases y pH','Movimiento','Fuerzas','Máquinas simples','Energía','Calor y temperatura','Electricidad y magnetismo','Luz y sonido'],
  'Historia':['Prehistoria','Primeros seres humanos','Revolución agrícola','Nacimiento de la escritura','Primeras civilizaciones','Egipto y Mesopotamia','Grecia','Roma','Pueblos originarios de América','Mesoamérica','Olmecas','Periodo Clásico','Toltecas','Mexicas','Fundación de México-Tenochtitlan','Llegada de los europeos a América','Conquista de México','Nueva España','Independencia de México','México durante el siglo XIX','Reforma','Porfiriato','Revolución Mexicana','México posrevolucionario','Primera Guerra Mundial','Segunda Guerra Mundial','Guerra Fría','México y el mundo contemporáneo'],
  'Geografía':['Orientación','Mapas y coordenadas','Relieve y placas tectónicas','Clima','Agua','Población','Migración','Actividades económicas','Recursos naturales','México y Zacatecas','Continentes y países','Urbanización y medio ambiente'],
  'Formación Cívica y Ética':['Identidad personal','Autoconocimiento','Emociones','Diversidad','Convivencia','Valores','Normas y reglas','Derechos humanos','Responsabilidades','Libertad','Toma de decisiones','Consecuencias de nuestros actos','Ética','Resolución de conflictos','Justicia','Igualdad','Democracia','Participación ciudadana','Comunidad','Cultura de paz'],
  'Inglés Básico':["Hello! — saludos, despedidas, My name is…, please, thank you","About me — nombre, edad, lugar donde vive, gustos; I am… / I like… / I don't like…","Alphabet & Numbers — alfabeto, deletreo, números 1–100 y fechas","People & Pronouns — I, you, he, she, we, they; introducción al verbo TO BE","Describing People — adjetivos, características físicas y personales; He is… / She is… / He has… / She has…","My Family — miembros de la familia; This is my… / his / her","My Daily Routine — wake up, eat, go to school, study, play, sleep; introducción al presente simple","Time, Days & Dates — días, meses, fechas y hora; Today, tomorrow, yesterday","Food & Drinks — alimentos y bebidas; I like… / I don't like… / I want…","My House & Community — casa, escuela, tienda, parque, habitaciones y lugares; There is / There are; preposiciones básicas","What Can I Do? — Can / can't; habilidades y acciones","Let's Communicate — preguntas y respuestas básicas, presentaciones, descripciones, rutinas, gustos y pequeños diálogos"],
};

// Campo formativo de cada materia según GIS (LEN, SPC, ENS).
export const GP_CAMPO = {
  'Lenguajes / Español':'LEN',
  'Inglés Básico':'LEN',
  'Matemáticas':'SPC',
  'Biología / Ciencias de la Vida':'SPC',
  'Física y Química':'SPC',
  'Historia':'ENS',
  'Geografía':'ENS',
  'Formación Cívica y Ética':'ENS',
};

export const CAMPO_NOMBRE = { LEN: 'Lenguajes', SPC: 'Saberes y pensamiento científico', ENS: 'Ética, naturaleza y sociedades', HUM: 'De lo humano y lo comunitario' };
