const contractSource = `
payable contract DacadeHouses =
      
  record house = {
    id:int,
    name: string,
    price:int,
    purchased:bool,
    description : string,
    images:string,
    owner:address,
    // Number of rooms
    rooms : int,
    // Size in sqft
    size : int, 

    bathrooms : int,
    garage : int,
    filehash : string
    
    }
  record state = 
    {
      houseLength : int,
      houses : map(int, house)
    }
  entrypoint init() = 
    { houses = {}, 
      houseLength = 0}
    
  entrypoint getHouseLength() : int = 
    state.houseLength


  payable stateful entrypoint addHouse(
        name':string,
        price':int,
        images':string,
        size' : int, 
        rooms' : int,
        bathrooms' : int, 
        garage' : int , 
        description' : string,
        filehash' : string ) =
    let house = {id=getHouseLength() + 1,
         name=name', 
         price=price', 
         description = description', 
         images=images',
         rooms = rooms',
         size = size',
         bathrooms = bathrooms',
         garage = garage',
         purchased=false, 
         owner=Call.caller, 
         filehash=filehash' }
    let index = getHouseLength() + 1
    put(state{houses[index] = house, houseLength  = index})


  entrypoint getHouse(index:int) : house = 
    switch(Map.lookup(index, state.houses))
      None => abort("House does not exist with this index")
      Some(x) => x  


  payable stateful entrypoint buyHouse(_id:int)=
    let house = getHouse(_id)
    
    let  owner  = house.owner 
    
    require(house.id > 0,abort("NOT A House "))
    
    require(Chain.balance(house.owner)>= house.price,abort("You Don't Have Enough AE"))
    
    let updated_house = {
      id=house.id,
      name=house.name,
      price=house.price,
      rooms = house.rooms,
      size = house.size,
      garage = house.garage,
      bathrooms = house.bathrooms,
      images=house.images,
      description = house.description,
      purchased = true, 
      owner=Call.caller,
      filehash = house.filehash}
    
    put(state{houses[_id] = updated_house})
    
    
    Chain.spend(owner, Call.value)
          `;




const contractAddress = 'ct_jyuwnmt3e7D7vHLFAQZHWhPJMDgfiSEQKfepuuaZPiRpGj5iW';
var HouseArray = [];
var client = null;
// var gameLength = 0;






function renderProduct() {
//   HouseArray = HouseArray.sort(function (a, b) {
//     return b.Price - a.Price
//   })
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    HouseArray
  });




  $('#housebody').html(rendered);
  console.log("Rendered")
}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}



// test



document.addEventListener('DOMContentLoaded', async () => {

  $(".loader").fadeIn();


  const node = await IpfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',

  })
  console.log(node)
  window.node = node

  $(".loader").hide();

})
var buffer = null

window.addEventListener('load', async () => {
  $(".loader").fadeIn();

  client = await Ae.Aepp()

  houseLength = await callStatic('getHouseLength', []);



  for (let i = 1; i <= houseLength; i++) {
    const houses = await callStatic('getHouse', [i]);

    HouseArray.push({
      id: houses.id,
      image: houses.images,
      name: houses.name,
      rooms : houses.rooms,
      garage : houses.garage,
      size : houses.size,
      bathroom : houses.bathrooms,
      price: houses.price,
      purchased: houses.purchased,
      description: houses.description,
      hash: houses.filehash

    })
  }

  renderProduct();
  $(".loader").fadeOut();
});



// This connects youtopublic ipfs gateway
const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });

// Converts the uploaded file to a buffer which is required to upload to an ipfs node
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result)
      ipfs.add(buffer)
        .then(files => {
          resolve(files)
        })
        .catch(error => reject(error))
    }
    reader.readAsArrayBuffer(file)
  })
}




// Register House
$('#regButton').click(async function () {
  $(".loader").show();

  var name = ($('#name').val()),

  rooms = ($('#rooms').val());
  size = ($('#size').val());

  bathroom = ($('#bathrooms').val());

  garage = ($('#garage').val());

  price = ($('#price').val());

  console.log(rooms)
  console.log(size)
  console.log(bathroom)
  console.log(price)


  description = ($('#description').val());

  image = ($('#image').val());

  // gets the uploaded file

  newfile = document.getElementById('customfiles')


  console.log(newfile)
  console.log(newfile.files[0])

  file = newfile.files[0]

  // waits for the uploadFile function to be called
  const files = await uploadFile(file)
  const multihash = files[0].hash

  prices = parseInt(price, 10)
  await contractCall('addHouse', [name, price, image, size, rooms, bathroom, garage, description, multihash], 1000)
  console.log(multihash)
  regHouse = await callStatic("getHouse", [HouseArray.length])

  HouseArray.push({
    id: regHouse.id,
    image: regHouse.images,
    name: regHouse.name,
    rooms : regHouse.rooms,
    garage : regHouse.garage,
    size : regHouse.size,
    bathroom : regHouse.bathrooms,
    price: regHouse.price,
    purchased: regHouse.purchased,
    description: regHouse.description,
    hash: regHouse.filehash


  })
  location.reload()
  renderProduct();
  $(".loader").hide();
});










$("#housebody").click(".purchaseBtn", async function (event) {
  $(".loader").fadeIn();
  console.log("Purchasing")
  

  // targets the element being clicked
  dataIndex = event.target.id
  console.log(dataIndex)

//   console.log(HouseArray[dataIndex].purchased)

  // calls the getHouse function from the smart contract
  house = await callStatic('getHouse', [dataIndex])


  await contractCall('buyHouse', [dataIndex], parseInt(house.price, 10))

  const foundIndex  =  HouseArray.findIndex(house => house.id == dataIndex)
  console.log(foundIndex)
    HouseArray[foundIndex].purchased =  true
  renderProduct();
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@ GEtting bought file")
  console.log("Copy this link and paste in a new tab to download the documents: https://ipfs.io/ipfs/" + house.filehash)
  // var bought  = document.getElementById('link')
  // console.log(bought)
  // bought.innerHTML = "Download Link : www.ipfs.io/ipfs/"+ game.filehash;
  $(".loader").hide();
});