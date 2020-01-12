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


  payable stateful entrypoint addHouse(name':string, price':int, images':string, description' : string, filehash' : string ) =
    let house = {id=getHouseLength() + 1, name=name', price=price', description = description', images=images',purchased=false, owner=Call.caller, filehash=filehash' }
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
      images=house.images,
      description = house.description,
      purchased = true, 
      owner=Call.caller,
      filehash = house.filehash}
    
    put(state{houses[_id] = updated_house})
    
    
    Chain.spend(owner, Call.value)
          `;




const contractAddress = 'ct_2BTe9KcuuAHwEGRnpbr1bGf3p2ymUSLUKdyXBjvy18JUHrrGUE';
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
  $(".loader").show();

  client = await Ae.Aepp()

  houseLength = await callStatic('getHouseLength', []);



  for (let i = 1; i <= houseLength; i++) {
    const houses = await callStatic('getHouse', [i]);

    HouseArray.push({
      id: houses.id,
      image: houses.images,
      name: houses.name,
      price: houses.price,
      purchased: houses.purchased,
      description: houses.description,
      hash: houses.filehash

    })
  }

  renderProduct();
  $(".loader").hide();
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




// // Register House
// $('#regButton').click(async function () {
//   $("#loadings").show();

//   var name = ($('#name').val()),

//   price = ($('#price').val());

//   description = ($('#description').val());

//   image = ($('#image').val());

//   // gets the uploaded file

//   newfile = document.getElementById('customfiles')


//   console.log(newfile)
//   console.log(newfile.files[0])

//   file = newfile.files[0]

//   // waits for the uploadFile function to be called
//   const files = await uploadFile(file)
//   const multihash = files[0].hash

//   prices = parseInt(price, 10)
//   reggame = await contractCall('addGame', [name, prices, image, description, multihash], 1000)
//   console.log(multihash)

//   GameArray.push({
//     id: GameArray.length + 1,
//     name: name,
//     hash: multihash,
//     price: prices



//   })
//   location.reload((true))
//   renderProduct();
//   $("#loadings").hide();
// });










$("#body").click(".btn", async function (event) {
  $("#loadings").show();
  console.log("Purchasing")

  // targets the element being clicked
  dataIndex = event.target.id

  // calls the getGame function from the smart contract
  game = await callStatic('getGame', [dataIndex])


  await contractCall('buyGame', [dataIndex], parseInt(game.price, 10))

  renderProduct();
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@ GEtting bought file")
  console.log("Copy this link and paste in a new tab to download your game : https://ipfs.io/ipfs/" + game.filehash)
  // var bought  = document.getElementById('link')
  // console.log(bought)
  // bought.innerHTML = "Download Link : www.ipfs.io/ipfs/"+ game.filehash;
  $("#loadings").hide();
});