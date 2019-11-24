var express = require("express");
var bodyparser = require("body-parser");
var app = express();
const request = require("request");
const Clarifai = require("clarifai");

const model = new Clarifai.App({ apiKey: "1f9bb490007547d4a0070b895e9487e2" });

var port = process.env.PORT || 3000;

var firebase_controller = require("./controllers/firebase_cloud");
firebase_controller(app);

const setup = () => {
  app.use(bodyparser.urlencoded({ extended: false }));
  app.use(bodyparser.json());
  app.get("/", (req, res) => res.send("Hello World!"));
  app.post("/api/imageurl", function(req, res) {
    url = req.body.url;
    detect(data, res);
  });
  app.post("/api/base64", (req, res) => {
    image = req.body.img;
  });
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};

let detect = (data, res) => {
  model.models
    .predict("bd367be194cf45149e75f01d59f77ba7", url)
    .then(response => {
      out = {
        name: response.outputs[0].data.concepts[0].name,
        confidence: response.outputs[0].data.concepts[0].value,
        address: "http://localhost:5000/?url=" + data
      };
      return out, res;
    })
    .then(make_req);
};

let make_req = (out, res) => {
  request(out.address, { json: true }, (err, res, body) => {
    out.width = body.width;
    out.length = body.length;
    out.area = body.area;
    out.height = body.height;
    if (err) {
      console.log(err);
    }
    console.log(body);
    calc_macro(out, res);
  });
};

let calc_macro = (out, res) => {
  volume = out.area * out.height;
  density_map = {
    apple: 0.2401,
    egg: 1.031,
    banana: 1,
    "chocolate bar": 1.325,
    default: 1
  };
  name = out.name;
  mass = density_map.name * volume || volume;
  request.post(
    {
      url: "https://trackapi.nutritionix.com/v2/natural/nutrients",
      json: {
        query: mass + " grams of " + out.name,
        timezone: "US/Eastern"
      },
      headers: {
        "Content-Type": "application/json",
        "x-app-id": "728a7023",
        "x-app-key": "f8e3dbfdcbf2ed6634fc902128695159"
      }
    },
    function(error, response, body) {
      if (!error && response.statusCode == 200) {
        macros = {
          name: foods[0].food_name,
          serving_qty: foods[0].serving_qty,
          serving_weight_grams: foods[0].serving_weight_grams,
          calories: foods[0].calories,
          total_fat: foods[0].total_fat,
          saturated_fat: foods[0].saturated_fat,
          cholesteral: foods[0].cholesteral,
          sodium: foods[0].sodium,
          carbs: foods[0].total_carbohydrate,
          fiber: foods[0].fiber,
          sugar: foods[0].sugars,
          protein: foods[0].protein,
          potassium: foods[0].potassium,
          nutrients: foods[0].nutrients,
          time_consumed: foods[0].consumed_at
        };
        res.send(macros);
      }
    }
  );
};

setup();
