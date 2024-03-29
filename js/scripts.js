// Estas dos funciones las utilizamos para agilizar un poco, para hacer el codigo un poco mas corto:
function getStorage() {
  let storage = JSON.parse(localStorage.getItem("cart")) || [];
  return storage;
}
function getStorageAny(array) {
  JSON.parse(localStorage.getItem(array));
}

function setStorage(array) {
  localStorage.setItem("cart", JSON.stringify(array));
}

// Con este fragmento de codigo contamos cuantos items hay en el cart independientemente de si alguno de los items se repite, cuenta como mas de uno.
function cartLength() {
  const bringCart = getStorage();
  if (bringCart !== null) {
    let cartCounter = 0;
    for (prods of bringCart) {
      cartCounter += prods.cantidad;
    }
    document.getElementById("prod-quantity").innerHTML = cartCounter;
  }
}
cartLength();

// Fetch para empezar a trabajar con una base de datos traida desde un archivo "data.json":
let cart;
let bringProducts = [];
let testing;
let upToDateStock;
let backUp;
let actualStock;
fetch("/js/data.json")
  .then((res) => res.json())
  .then((data) => {
    bringProducts = data;
  })
  .then(() => generateCards(bringProducts))
  .then(() => localStorage.setItem("cartStock0", JSON.stringify(bringProducts)))
  .then(() => defineUpToDateStock())
  .then(() => generateCards(upToDateStock))
  .then(() => saleProducts())
  .then(() => totalPrice());

// Funcion saleProducts para que se muestren los productos en oferta unicamente al presionar el enlace "oferta"

function saleProducts() {
  JSON.parse(localStorage.getItem("realStock")) == null
    ? (actualStock = JSON.parse(localStorage.getItem("cartStock0")))
    : (actualStock = JSON.parse(localStorage.getItem("realStock")));
  const saleProducts = upToDateStock.filter(
    (product) => product.status === "offer"
  );
  const saleButton = document.getElementById("sale-product");
  saleButton.onclick = () => generateCards(saleProducts);
  console.log(saleProducts);
}

// Funcion "defineUpToStock" con condicional, para que dependiendo de la situacion, si ya hay items en el carrito o no, UpToDateStock copie al "realStock" o que se inicie copiando a backUp.
function defineUpToDateStock() {
  backUp = JSON.parse(localStorage.getItem("cartStock0"));
  localStorage.getItem("realStock") === null
    ? (upToDateStock = backUp)
    : (upToDateStock = JSON.parse(localStorage.getItem("realStock")));
}

// Validacion de si el cart en el local storage es null, o si tiene elementos adentro con un ternario.
function stockValidation() {
  let cartStorage = getStorage();
  localStorage.getItem("cart") != null ? (cart = cartStorage) : (cart = []);
}
stockValidation();

// Con la funcion generateCards, a traves de un forEach recorre el parametro de la funcion (deberia ser un array), y va agregando a traves de un forEach todos los productos al cardAccumulator. La funcion temrina con otra funcion “showCardsInHTML“ que tiene como parametro el cardAccumulator variable let de la actual funcion.
function generateCards(productsToShow) {
  let cardAccumulator = ``;
  productsToShow.forEach((arrayElement) => {
    cardAccumulator += `<div class="col mb-5">
        <div class="card h-100">
            <!-- sale badge-->
            <div class="badge bg-dark text-white position-absolute" style="top: 2.5rem; right: 0.5rem">
                ${arrayElement.status === "offer" ? "En Oferta" : ""}
            </div>
            <!-- stock badge-->
            <div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">
                ${arrayElement.stock > 0 ? "Stock disponible" : "Sin stock"}
            </div>
            <!-- Product image-->
            <img class="card-img-top" src="${arrayElement.image}" alt="..." />
            <!-- Product details-->
            <div class="card-body p-4"> 
                <div class="text-center">
                    <!-- Product name-->
                    <h5 class="fw-bolder">${arrayElement.title}</h5>
                    <!-- Product price-->
                    <input value="1" min="1" id="cantidad-${
                      arrayElement.id
                    }" type="number" placeholder="cantidad">
                    $${arrayElement.price}
                </div>
            </div>
            <!-- Product actions-->
            <div class="card-footer p-4 pt-0 border-top-0 bg-transparent" >
                <div class="text-center">
                    <button onclick="trigger(${
                      arrayElement.id
                    });renderCart()" id="${arrayElement.id}" 
                    class="btn btn-outline-dark mt-auto cardButton" href="#">
                        Add to cart
                    </button>
                </div>
            </div>
        </div>
    </div>`;
  });
  showCardsInHTML(cardAccumulator);
}

// Con esta funcion mostramos las cards en el HTML, con el cardAccumulator como parametro, que es la variable que se creo arriba que almaceno las cards del objeto que se le pida que recorra.
function showCardsInHTML(cards) {
  document.getElementById("product-list").innerHTML = cards;
}

// Probando como cuando se haga click que nos traiga el id para ponerelo como parametro en la funcion de addtocart(). Aca cambie la forma de manejar el evento, en la entrega anterior estaba en el onClick en las cards que se generaban. Con esta funcion lo modifique para que se realiza de esta otra forma.
function trigger(e) {
  const variableId = parseInt(e);
  addToCart(variableId);
}

// Funcion "addToCart()" para agregar productos al cart.
function addToCart(id) {
  // Verificacion de stock disponible:
  const quantityValue = parseInt(
    document.getElementById("cantidad-" + id).value
  );
  if (quantityValue > upToDateStock[id].stock && upToDateStock[id].stock > 0) {
    return swal(
      `Contamos unicamente con ${
        upToDateStock[id].stock
      } unidades de "${upToDateStock[id].title.toLocaleUpperCase()}".`,
      "Mil disculpas!"
    );
  } else if (upToDateStock[id].stock < 1) {
    generateCards(upToDateStock);
    return swal(
      `No contamos con mas "${upToDateStock[id].title.toLocaleUpperCase()}".`,
      "Mil disculpas!"
    );
  }
  // Modificacion de stock:
  let modifiedStock = upToDateStock[id].stock - quantityValue;
  upToDateStock[id].stock = modifiedStock;
  localStorage.setItem("realStock", JSON.stringify(upToDateStock));
  let selectedProduct = bringProducts.find((element) => element.id === id);
  let index = cart.findIndex((prod) => prod.id === id);
  if (index !== -1) {
    cart[index].cantidad = cart[index].cantidad + quantityValue;
    swal(
      `Se ha agregado "${upToDateStock[
        id
      ].title.toLocaleUpperCase()}" al carrito`,
      "Muchas gracias!",
      "success"
    );
    setStorage(cart);
  } else {
    // Me gustaria entender la segunda parte de esto, cantidad:1, es una forma de modificar la propiedad a la vez que estamos concatenando cosas??
    cart.push({ ...selectedProduct, cantidad: 1 * quantityValue });
    swal(
      `Se ha agregado "${upToDateStock[
        id
      ].title.toLocaleUpperCase()}" al carrito`,
      "Muchas gracias!",
      "success"
    );
    setStorage(cart);
  }
  localStorage.setItem("realStock", JSON.stringify(upToDateStock));
  generateCards(upToDateStock);
  cartLength();
  totalPrice();
}

// Funcion renderCart, lo que hace es agregar en la seccion del HTML los productos que se van seleccionando.
const tbody = document.querySelector(".tbody");
function renderCart() {
  cart = getStorage();
  tbody.innerHTML = "";
  cart.map((item) => {
    const tr = document.createElement("tr");
    tr.classList.add("cartItem");
    const content = `
    <td class="table__products">
    <img src=${item.image}  alt="">
    <h6 class="title-${item.id}">${item.title}</h6>
    </td>
    <td class="table__price"><p>$ ${item.price}</p></td>
    <td class="table__cantidad">
    <input onclick="cartInputChange(${item.id})" type="number" min="1" value=${item.cantidad} class="input-element-${item.id}">
    <button onclick="deleteProduct(${item.id})" id=deleteButton-${item.id} class="select delete btn btn-danger">x</button>
    </td>
    
    `;
    tr.innerHTML = content;
    tbody.append(tr);
  });
}

//Con esta funcion buscamos los productos, a traves del filter.
function searchProduct() {
  const productSearchedName = document
    .getElementById("searched-product")
    .value.toUpperCase()
    .trim();
  const findedProducts = backUp.filter((product) =>
    // Usar en vez de products lo del localstorage
    product.title.toUpperCase().match(productSearchedName)
  );
  if (findedProducts.length > 0) {
    generateCards(findedProducts);
  } else
    swal(
      `Por el momento no contamos con "${productSearchedName}"`,
      "Lo sentimos!"
    );
}

// Funcion para que ande el enter en el buscador.
function startEnter() {
  const input = document.getElementById("searched-product");
  input.addEventListener("keyup", function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      document.getElementById("search-button").click();
    }
  });
}
startEnter();

// FUncion window.onload, es para que cuando actualicemos la pagina, que se corra la funcion renderCart() para se muestren los productos en el carrito.
window.onload = function () {
  renderCart();
};

// Funcion para eliminar productos que esten en el renderizado del carro
function deleteProduct(id) {
  const deleteButton = document.getElementById("deleteButton-" + id);
  const tr = deleteButton.closest(".cartItem");
  const title = tr.querySelector(".title-" + id).textContent;
  cart.forEach((prods) => {
    if (prods.title === title) {
      const indexProd = cart.findIndex((prods) => prods.title === title);
      cart.splice(indexProd, 1);
      setStorage(cart);
    }
  });
  tr.remove();

  // Recorremos este bucle para que cuente cuantos items distintos tenemos en el cart. Esta la variable "cartCounterVariety" la usamos abajo para ayudarnos con la logica para recorrer los bucles de upToDateStock y cart, y verificar coincide o no con "validationCounter".
  let cartCounterVariety = 0;
  for (prods of cart) {
    cartCounterVariety++;
  }
  // Vamos a actualizar el realStock para que este vinculado al del cart cuando eliminemos productos desde el carrito.
  // La variable "validationCounter" la usamos para compararla con la variable "cartCounterVariety", cuando son iguales, quiere decir que el bucle for en el cart se recorrio las mismas veces que la cantidad de productos en el cart, entonces son productos que no estan en el cart, por lo tanto el stock hay que igualarlo al original, porque puede que algun producto se haya eliminado, por eso es necesario actualizar el stock.
  let realStockActualizator = JSON.parse(localStorage.getItem("cartStock0"));
  for (upToProds of upToDateStock) {
    let validationCounter = 0;
    if (cart.length > 0) {
      for (cartProds of cart) {
        if (upToProds.title === cartProds.title) {
          break;
        } else if (upToProds.title !== cartProds.title) {
          validationCounter++;
        }
        if (validationCounter == cartCounterVariety) {
          let actualProduct = upToProds.id;
          upToDateStock[actualProduct].stock =
            realStockActualizator[actualProduct].stock;
        }
      }
      localStorage.setItem("realStock", JSON.stringify(upToDateStock));
    }
    if (cart.length == 0) {
      localStorage.setItem("realStock", JSON.stringify(bringProducts));
      defineUpToDateStock();
    }
  }
  cartLength();
  totalPrice();
  generateCards(upToDateStock);
}

// Funcion para darle funcionalidad a los inputs del cart para subir o bajar productos.

function cartInputChange(id) {
  let newProductValue = parseInt(
    document.querySelector(".input-element-" + id).value
  );
  let index = cart.findIndex((prod) => prod.id === id);
  const previousCartQuantity = cart[index].cantidad;
  const actualCartQuantity = newProductValue;
  // Condicionales para comprobar si hay stock o no para poder hacer el cambio.
  const stockActualizator = actualCartQuantity - previousCartQuantity;
  upToDateStock[id].stock = upToDateStock[id].stock - stockActualizator;
  if (upToDateStock[id].stock < 0) {
    upToDateStock[id].stock = upToDateStock[id].stock + stockActualizator;
    cart[index].cantidad = cart[index].cantidad;
    swal(
      `Contamos unicamente con ${
        bringProducts[id].stock
      } unidades de "${upToDateStock[id].title.toLocaleUpperCase()}".`,
      "Mil disculpas!"
    );
    document.querySelector(".input-element-" + id).innerHTML =
      previousCartQuantity;
    window.setTimeout(function () {
      location.reload();
    }, 2500);
    return;
  }
  cart[index].cantidad = newProductValue;
  localStorage.setItem("realStock", JSON.stringify(upToDateStock));
  generateCards(upToDateStock);
  setStorage(cart);
  totalPrice();
}
// Funcion "totalPrice()" que va a sumar el precio total que tenemos en el carrito:
const cartTotal = document.querySelector(".cartTotal");
function totalPrice() {
  let actualPrice = 0;
  for (item of cart) {
    actualPrice += item.price * item.cantidad;
  }
  cartTotal.innerHTML = "Precio Total: $" + actualPrice;
}
