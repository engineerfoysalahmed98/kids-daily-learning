import type { KnowledgeUnit } from "../types";
import { img, match, mc, order, tf, typed } from "./q";

/**
 * Science and General Knowledge units, ordered so that the first unit for each
 * level is the one a brand-new child sees on day one.
 */
export const UNITS: KnowledgeUnit[] = [
  // ------------------------------------------------------------ SCIENCE L1
  {
    id: "sci-colors", subject: "science", topic: "Environment", title: "Colors in Nature", icon: "🌈", level: 1,
    cards: [
      { emoji: "🍃", title: "Green leaves", body: "Most leaves are green." },
      { emoji: "🌊", title: "Blue sea", body: "The sea and the sky look blue." },
      { emoji: "🍓", title: "Red berries", body: "Strawberries are red when they are ready to eat." },
    ],
    questions: [
      img("sci-colors-1", "Which one is yellow?", [["🍌", "Banana"], ["🍇", "Grapes"], ["🥦", "Broccoli"]], 0, "A banana is yellow!"),
      img("sci-colors-2", "Which one is green?", [["🍎", "Red apple"], ["🐸", "Frog"], ["🌞", "Sun"]], 1, "Frogs are often green, like leaves."),
      tf("sci-colors-3", "The sky is usually blue on a sunny day.", true, "Yes! On a sunny day the sky looks blue.", "☀️"),
      img("sci-colors-4", "Which one is orange?", [["🥕", "Carrot"], ["🫐", "Blueberry"], ["🥒", "Cucumber"]], 0, "Carrots are orange and crunchy."),
      tf("sci-colors-5", "Snow is purple.", false, "Snow is white, like a fluffy cloud.", "❄️"),
    ],
  },
  {
    id: "sci-animal-homes", subject: "science", topic: "Animals", title: "Animal Homes", icon: "🏡", level: 1,
    cards: [
      { emoji: "🐦", title: "Birds", body: "Birds live in nests." },
      { emoji: "🐝", title: "Bees", body: "Bees live in a hive." },
      { emoji: "🐟", title: "Fish", body: "Fish live in water." },
    ],
    questions: [
      img("sci-ah-1", "Where does a fish live?", [["💧", "Water"], ["🌳", "Tree"], ["🏜️", "Desert"]], 0, "Fish live and swim in water."),
      img("sci-ah-2", "Who lives in a hive?", [["🐝", "Bee"], ["🐶", "Dog"], ["🐄", "Cow"]], 0, "Bees live together in a hive."),
      tf("sci-ah-3", "Birds build nests.", true, "Yes! Birds build nests from twigs and grass.", "🪺"),
      match("sci-ah-4", "Match each animal to its home.", [["🐦 Bird", "Nest"], ["🐝 Bee", "Hive"], ["🐟 Fish", "Pond"]], "Every animal has a home that keeps it safe."),
      tf("sci-ah-5", "A cow lives in the ocean.", false, "Cows live on farms and eat grass.", "🐄"),
    ],
  },
  // ------------------------------------------------------------ SCIENCE L2
  {
    id: "sci-amazing-animals", subject: "science", topic: "Animals", title: "Amazing Animals", icon: "🦒", level: 2,
    cards: [
      { emoji: "🦒", title: "Giraffes", body: "Giraffes are the tallest animals. Their long necks help them reach leaves high in trees." },
      { emoji: "🐧", title: "Penguins", body: "Penguins are birds that cannot fly — but they are super swimmers!" },
      { emoji: "🐘", title: "Elephants", body: "Elephants use their trunks to drink, smell and even say hello." },
      { emoji: "🦉", title: "Owls", body: "Owls are awake at night. They have big eyes to see in the dark." },
    ],
    questions: [
      img("sci-aa-1", "Which animal is the tallest?", [["🦒", "Giraffe"], ["🐶", "Dog"], ["🐰", "Rabbit"]], 0, "Giraffes are the tallest animals on Earth."),
      tf("sci-aa-2", "Penguins can fly high in the sky.", false, "Penguins are birds, but they swim instead of fly.", "🐧"),
      mc("sci-aa-3", "What does an elephant use its trunk for?", ["Drinking water", "Flying", "Swimming fast"], 0, "An elephant sucks up water with its trunk, then sprays it into its mouth.", "🐘"),
      match("sci-aa-4", "Match the animal to its super power.", [["🦉 Owl", "Sees in the dark"], ["🐧 Penguin", "Super swimmer"], ["🦒 Giraffe", "Reaches tall trees"]], "Every animal has a body that helps it live in its home."),
      tf("sci-aa-5", "Owls are awake at night.", true, "Yes! Owls hunt at night and sleep in the day.", "🦉"),
    ],
  },
  {
    id: "sci-plants", subject: "science", topic: "Plants", title: "What Plants Need", icon: "🌻", level: 2,
    cards: [
      { emoji: "☀️", title: "Sunlight", body: "Plants use sunlight to make their own food." },
      { emoji: "💧", title: "Water", body: "Roots drink water from the soil." },
      { emoji: "🌬️", title: "Air", body: "Leaves take in air to help the plant grow." },
    ],
    questions: [
      mc("sci-pl-1", "Which part of a plant drinks water from the soil?", ["Roots", "Petals", "Flowers"], 0, "Roots are like straws under the ground.", "🌱"),
      tf("sci-pl-2", "Plants need sunlight to grow.", true, "Yes! Sunlight helps plants make food.", "🌻"),
      order("sci-pl-3", "Put the plant's life in order.", ["🌰 Seed", "🌱 Sprout", "🌿 Young plant", "🌻 Flower"], "A seed sprouts, grows and then flowers."),
      img("sci-pl-4", "Which one is a plant?", [["🌵", "Cactus"], ["🪨", "Rock"], ["🧸", "Teddy"]], 0, "A cactus is a plant that lives in dry places."),
      tf("sci-pl-5", "Plants can grow in a dark cupboard forever.", false, "Plants need light. In the dark they get weak and pale.", "🚪"),
    ],
  },
  // ------------------------------------------------------------ SCIENCE L3
  {
    id: "sci-body", subject: "science", topic: "Human body", title: "My Amazing Body", icon: "🫀", level: 3,
    cards: [
      { emoji: "🫀", title: "Heart", body: "Your heart pumps blood all around your body, day and night." },
      { emoji: "🫁", title: "Lungs", body: "Your lungs fill with air when you breathe in." },
      { emoji: "🦴", title: "Bones", body: "Adults have 206 bones. They hold you up and protect you." },
      { emoji: "🧠", title: "Brain", body: "Your brain is the boss. It helps you think, move and feel." },
    ],
    questions: [
      mc("sci-bd-1", "Which organ pumps blood?", ["Heart", "Lungs", "Stomach"], 0, "The heart is a strong muscle that pumps blood.", "🫀"),
      tf("sci-bd-2", "Your lungs help you breathe.", true, "Yes! Lungs take in air with oxygen.", "🫁"),
      match("sci-bd-3", "Match the body part to its job.", [["🧠 Brain", "Thinks"], ["🦴 Bones", "Hold you up"], ["🫁 Lungs", "Breathe"]], "Each part of your body has an important job."),
      mc("sci-bd-4", "Which helps keep your body healthy?", ["Drinking water", "Skipping sleep", "Only eating sweets"], 0, "Water, good sleep and healthy food keep your body strong."),
      typed("sci-bd-5", "How many bones does an adult have?", ["206"], "An adult skeleton has 206 bones.", "numeric", "🦴"),
    ],
  },
  {
    id: "sci-weather", subject: "science", topic: "Environment", title: "Weather Watchers", icon: "⛅", level: 3,
    cards: [
      { emoji: "☁️", title: "Clouds", body: "Clouds are made of tiny drops of water floating in the air." },
      { emoji: "🌧️", title: "Rain", body: "When the drops join and get heavy, they fall as rain." },
      { emoji: "🌈", title: "Rainbows", body: "Sunlight shining through raindrops can make a rainbow." },
    ],
    questions: [
      mc("sci-wx-1", "What are clouds made of?", ["Tiny water drops", "Cotton", "Smoke"], 0, "Clouds are made of tiny droplets of water.", "☁️"),
      tf("sci-wx-2", "You need both sun and rain to see a rainbow.", true, "Yes! Sunlight through raindrops makes a rainbow.", "🌈"),
      img("sci-wx-3", "Which tool tells us the temperature?", [["🌡️", "Thermometer"], ["🔨", "Hammer"], ["✂️", "Scissors"]], 0, "A thermometer measures how hot or cold it is."),
      order("sci-wx-4", "Put the rain story in order.", ["☀️ Sun warms water", "💨 Water rises as vapor", "☁️ Clouds form", "🌧️ Rain falls"], "This is called the water cycle!"),
      tf("sci-wx-5", "Snow falls when it is very hot.", false, "Snow needs freezing cold air.", "❄️"),
    ],
  },
  // ------------------------------------------------------------ SCIENCE L4
  {
    id: "sci-space", subject: "science", topic: "Space", title: "Our Solar System", icon: "🪐", level: 4,
    cards: [
      { emoji: "☀️", title: "The Sun", body: "The Sun is a star. Eight planets travel around it." },
      { emoji: "🌍", title: "Earth", body: "Earth is the third planet from the Sun and the only one we know has life." },
      { emoji: "🪐", title: "Saturn", body: "Saturn has beautiful rings made of ice and rock." },
      { emoji: "🔴", title: "Mars", body: "Mars is called the Red Planet because of its rusty dust." },
    ],
    questions: [
      mc("sci-sp-1", "What is the Sun?", ["A star", "A planet", "A moon"], 0, "The Sun is a star — the closest one to Earth.", "☀️"),
      typed("sci-sp-2", "How many planets travel around our Sun?", ["8", "eight"], "There are 8 planets in our solar system.", "numeric", "🪐"),
      mc("sci-sp-3", "Which planet is called the Red Planet?", ["Mars", "Venus", "Neptune"], 0, "Mars looks red because of rusty dust.", "🔴"),
      order("sci-sp-4", "Order these planets from closest to the Sun.", ["Mercury", "Venus", "Earth", "Mars"], "Mercury is closest, then Venus, Earth and Mars."),
      tf("sci-sp-5", "The Moon makes its own light.", false, "The Moon reflects light from the Sun.", "🌕"),
    ],
  },
  {
    id: "sci-water-cycle", subject: "science", topic: "Simple experiments", title: "Solids, Liquids & Gases", icon: "🧊", level: 4,
    cards: [
      { emoji: "🧊", title: "Solid", body: "Solids keep their shape, like ice or a wooden block." },
      { emoji: "💧", title: "Liquid", body: "Liquids flow and take the shape of their container, like water." },
      { emoji: "♨️", title: "Gas", body: "Gases spread out to fill a space, like steam." },
    ],
    questions: [
      mc("sci-st-1", "What happens when ice melts?", ["It becomes a liquid", "It becomes a gas right away", "It becomes a rock"], 0, "Heat turns solid ice into liquid water.", "🧊"),
      match("sci-st-2", "Match each to its state.", [["🧊 Ice", "Solid"], ["🥛 Milk", "Liquid"], ["♨️ Steam", "Gas"]], "Matter can be solid, liquid or gas."),
      tf("sci-st-3", "Water boils at 100 °C at sea level.", true, "Yes — that's when water turns into steam quickly.", "🫖"),
      mc("sci-st-4", "Which is a gas?", ["The air we breathe", "A pencil", "Orange juice"], 0, "Air is a mix of gases like oxygen.", "🌬️"),
      tf("sci-st-5", "Liquids keep the same shape in any cup.", false, "Liquids take the shape of their container.", "🥤"),
    ],
  },
  // ------------------------------------------------------------ SCIENCE L5
  {
    id: "sci-food-chains", subject: "science", topic: "Environment", title: "Food Chains", icon: "🦊", level: 5,
    cards: [
      { emoji: "🌾", title: "Producers", body: "Plants are producers — they make food from sunlight." },
      { emoji: "🐇", title: "Consumers", body: "Animals are consumers — they eat plants or other animals." },
      { emoji: "🍄", title: "Decomposers", body: "Fungi and worms break down dead things and return nutrients to the soil." },
    ],
    questions: [
      order("sci-fc-1", "Build the food chain from start to end.", ["☀️ Sun", "🌾 Grass", "🐇 Rabbit", "🦊 Fox"], "Energy flows from the Sun to plants to animals."),
      mc("sci-fc-2", "What is a producer?", ["A living thing that makes its own food", "An animal that eats meat", "A rock"], 0, "Plants are producers because they use sunlight to make food.", "🌿"),
      match("sci-fc-3", "Match each to its role.", [["🌳 Oak tree", "Producer"], ["🦉 Owl", "Consumer"], ["🍄 Mushroom", "Decomposer"]], "Every living thing has a role in an ecosystem."),
      tf("sci-fc-4", "If all the grass disappeared, rabbits would be affected.", true, "Rabbits eat grass, so food chains are connected.", "🐇"),
      mc("sci-fc-5", "Which is a decomposer?", ["Earthworm", "Eagle", "Sunflower"], 0, "Earthworms break down dead leaves into rich soil.", "🪱"),
    ],
  },
  {
    id: "sci-forces", subject: "science", topic: "Simple experiments", title: "Forces & Magnets", icon: "🧲", level: 5,
    cards: [
      { emoji: "🧲", title: "Magnets", body: "Magnets pull on things made of iron. Opposite poles attract; same poles push apart." },
      { emoji: "🍎", title: "Gravity", body: "Gravity pulls everything toward the ground." },
      { emoji: "🛷", title: "Friction", body: "Friction is a force that slows things down when surfaces rub together." },
    ],
    questions: [
      mc("sci-fo-1", "What will a magnet pick up?", ["An iron nail", "A plastic spoon", "A wooden block"], 0, "Magnets attract iron and steel.", "🧲"),
      tf("sci-fo-2", "Two north poles of magnets pull toward each other.", false, "The same poles push apart; opposite poles attract.", "🧲"),
      mc("sci-fo-3", "Why does a ball roll slower on grass than on a floor?", ["More friction", "Less gravity", "The ball gets lighter"], 0, "Grass rubs against the ball more, creating friction.", "⚽"),
      tf("sci-fo-4", "Gravity pulls a dropped apple to the ground.", true, "Yes — gravity pulls things toward Earth.", "🍎"),
      typed("sci-fo-5", "Fill the blank: The force that slows a sliding sled is ______.", ["friction"], "Friction slows down moving things.", "text", "🛷"),
    ],
  },

  // ------------------------------------------------------------ GENERAL KNOWLEDGE
  {
    id: "gk-shapes", subject: "gk", topic: "Everyday knowledge", title: "Shapes Everywhere", icon: "🔷", level: 1,
    cards: [
      { emoji: "⚪", title: "Circle", body: "A circle is round, like a wheel." },
      { emoji: "🟥", title: "Square", body: "A square has 4 equal sides." },
      { emoji: "🔺", title: "Triangle", body: "A triangle has 3 sides." },
    ],
    questions: [
      img("gk-sh-1", "Which one is a circle?", [["⚪", "Circle"], ["🟥", "Square"], ["🔺", "Triangle"]], 0, "A circle is perfectly round."),
      typed("gk-sh-2", "How many sides does a triangle have?", ["3", "three"], "Tri means three!", "numeric", "🔺"),
      img("gk-sh-3", "Which is shaped like a circle?", [["🍕", "Pizza slice"], ["🍪", "Cookie"], ["📦", "Box"]], 1, "A cookie is round like a circle."),
      tf("gk-sh-4", "A square has 4 sides.", true, "Yes! A square has 4 equal sides.", "🟦"),
      img("gk-sh-5", "Which one is a star?", [["⭐", "Star"], ["🔵", "Circle"], ["🔶", "Diamond"]], 0, "A star has pointy tips."),
    ],
  },
  {
    id: "gk-world", subject: "gk", topic: "Countries", title: "Around the World", icon: "🗺️", level: 2,
    cards: [
      { emoji: "🌍", title: "Continents", body: "Earth has 7 big pieces of land called continents." },
      { emoji: "🐨", title: "Australia", body: "Koalas and kangaroos live in Australia." },
      { emoji: "🐼", title: "China", body: "Giant pandas come from the mountains of China." },
    ],
    questions: [
      typed("gk-wd-1", "How many continents are there?", ["7", "seven"], "There are 7 continents.", "numeric", "🌍"),
      mc("gk-wd-2", "Where do kangaroos live?", ["Australia", "Antarctica", "Canada"], 0, "Kangaroos hop around Australia.", "🦘"),
      match("gk-wd-3", "Match each animal to where it lives.", [["🐼 Panda", "China"], ["🐨 Koala", "Australia"], ["🐧 Emperor penguin", "Antarctica"]], "Different animals live in different parts of the world."),
      tf("gk-wd-4", "The ocean covers most of Earth.", true, "Yes! About 70% of Earth is covered by water.", "🌊"),
      mc("gk-wd-5", "Which is the coldest continent?", ["Antarctica", "Africa", "Australia"], 0, "Antarctica is covered in ice.", "🧊"),
    ],
  },
  {
    id: "gk-places", subject: "gk", topic: "Famous places", title: "Famous Places", icon: "🗼", level: 3,
    cards: [
      { emoji: "🗼", title: "Eiffel Tower", body: "The Eiffel Tower is in Paris, France." },
      { emoji: "🗽", title: "Statue of Liberty", body: "The Statue of Liberty stands in New York, USA." },
      { emoji: "🕌", title: "Taj Mahal", body: "The Taj Mahal is a white marble building in India." },
      { emoji: "🏯", title: "Great Wall", body: "The Great Wall of China is thousands of kilometers long." },
    ],
    questions: [
      mc("gk-pl-1", "In which country is the Eiffel Tower?", ["France", "Japan", "Brazil"], 0, "The Eiffel Tower is in Paris, France.", "🗼"),
      match("gk-pl-2", "Match the place to its country.", [["🕌 Taj Mahal", "India"], ["🗽 Statue of Liberty", "USA"], ["🏯 Great Wall", "China"]], "Famous places help us learn about the world."),
      tf("gk-pl-3", "The Great Wall of China is very short.", false, "It is one of the longest structures ever built!", "🏯"),
      mc("gk-pl-4", "The Taj Mahal is made mostly of…", ["White marble", "Ice", "Wood"], 0, "It is built from shining white marble.", "🕌"),
      tf("gk-pl-5", "The pyramids of Giza are in Egypt.", true, "Yes! They were built over 4,000 years ago.", "🔺"),
    ],
  },
  {
    id: "gk-oceans", subject: "gk", topic: "Nature", title: "Oceans & Continents", icon: "🌊", level: 4,
    cards: [
      { emoji: "🌊", title: "Five oceans", body: "Pacific, Atlantic, Indian, Southern and Arctic." },
      { emoji: "🐋", title: "Pacific", body: "The Pacific is the biggest and deepest ocean." },
      { emoji: "🌏", title: "Asia", body: "Asia is the largest continent and has the most people." },
    ],
    questions: [
      mc("gk-oc-1", "Which is the largest ocean?", ["Pacific", "Arctic", "Indian"], 0, "The Pacific Ocean is the largest.", "🐋"),
      mc("gk-oc-2", "Which is the largest continent?", ["Asia", "Europe", "Australia"], 0, "Asia is the biggest continent.", "🌏"),
      typed("gk-oc-3", "How many oceans are there?", ["5", "five"], "There are 5 oceans.", "numeric", "🌊"),
      tf("gk-oc-4", "The Arctic Ocean is near the North Pole.", true, "Yes, the Arctic Ocean surrounds the North Pole.", "🧭"),
      order("gk-oc-5", "Order these from smallest to largest.", ["Pond", "Lake", "Sea", "Ocean"], "Oceans are the biggest bodies of water."),
    ],
  },
  {
    id: "gk-inventions", subject: "gk", topic: "Basic history", title: "Inventions Through History", icon: "💡", level: 5,
    cards: [
      { emoji: "🛞", title: "The wheel", body: "The wheel was invented over 5,000 years ago and changed how people moved things." },
      { emoji: "📜", title: "Paper", body: "Paper was invented in ancient China." },
      { emoji: "💡", title: "Light bulb", body: "Many inventors improved the electric light bulb in the 1800s." },
      { emoji: "✈️", title: "Airplane", body: "The Wright brothers flew the first powered airplane in 1903." },
    ],
    questions: [
      order("gk-in-1", "Order these inventions from oldest to newest.", ["🛞 Wheel", "📜 Paper", "💡 Light bulb", "💻 Computer"], "The wheel is ancient; computers are much newer."),
      mc("gk-in-2", "Where was paper first invented?", ["Ancient China", "Ancient Rome", "Canada"], 0, "Paper was invented in ancient China.", "📜"),
      typed("gk-in-3", "In what year did the Wright brothers first fly?", ["1903"], "They flew at Kitty Hawk in 1903.", "numeric", "✈️"),
      tf("gk-in-4", "The wheel is a new invention from the last 100 years.", false, "The wheel is more than 5,000 years old!", "🛞"),
      mc("gk-in-5", "Why was the printing press important?", ["Books could be made faster", "It made food", "It flew people"], 0, "More books meant more people could learn to read.", "📚"),
    ],
  },
];
