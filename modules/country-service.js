const env = require('dotenv').config();
const Sequelize = require('sequelize');
const countryData = require("../data/countryData");
const subRegionData = require("../data/subRegionData");

let countries = [];
let sequelize = new Sequelize();

const SubRegion = sequelize.define(
  'SubRegion',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true, // use "id" as a primary key
      autoIncrement: true, // automatically increment the value
    },
    subRegion: Sequelize.STRING,
    region: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);
const Country = sequelize.define(
  'Country',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true, // use "id" as a primary key
    },
    commonName: Sequelize.STRING,
    officialName: Sequelize.STRING,
    nativeName: Sequelize.STRING,
    currencies: Sequelize.STRING,
    capital: Sequelize.STRING,
    languages: Sequelize.STRING,
    openStreetMaps: Sequelize.STRING,
    population: Sequelize.INTEGER,
    area: Sequelize.INTEGER,
    landlocked: Sequelize.BOOLEAN,
    coatOfArms: Sequelize.STRING,
    flag: Sequelize.STRING,
    subRegionId: Sequelize.INTEGER,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
)
Country.belongsTo(SubRegion, {foreignKey: 'subRegionId'})

function initialize() {
  return new Promise((resolve, reject) => {
    countryData?.forEach(country => {
      let countryWithSubRegion = { ...country, subRegionObj: subRegionData.find(sr => sr.id == country.subRegionId) }
      countries.push(countryWithSubRegion);
      resolve();
    });
  });

}

function getAllCountries() {
  return new Promise((resolve, reject) => {
    resolve(countries);
  });
}

function getCountryById(id) {

  return new Promise((resolve, reject) => {
    let foundCountry = countries.find(c => c.id == id);

    if (foundCountry) {
      resolve(foundCountry); return;
    } else {
      reject("Unable to find requested country");
    }
  });
}

function getCountriesBySubRegion(subRegion) {

  return new Promise((resolve, reject) => {
    let foundCountries = countries.filter(c => c.subRegionObj.subRegion.toUpperCase().includes(subRegion.toUpperCase()));

    if (foundCountries.length > 0) {
      resolve(foundCountries)
    } else {
      reject(`Unable to find requested countries for the given subRegion - ${subRegion}`);
    }
  });

}

function getCountriesByRegion(region) {

  return new Promise((resolve, reject) => {
    let foundCountries = countries.filter(c => c.subRegionObj.region.toUpperCase().includes(region.toUpperCase()));

    if (foundCountries.length > 0) {
      resolve(foundCountries)
    } else {
      reject(`Unable to find requested countries for the given region - ${region}`);
    }
  });

}


module.exports = { initialize, getAllCountries, getCountryById, getCountriesByRegion, getCountriesBySubRegion }

// Code Snippet to insert existing data from Countries / SubRegions
sequelize
  .sync()
  .then( async () => {
    try{
      await SubRegion.bulkCreate(subRegionData);
      await Country.bulkCreate(countryData); 
      console.log("-----");
      console.log("data inserted successfully");
    }catch(err){
      console.log("-----");
      console.log(err.message);

      // NOTE: If you receive the error:

      // insert or update on table "Countries" violates foreign key constraint "Countries_subRegionId_fkey"

      // it is because you have a "Country" in your collection that has a "subRegionId" that does not exist in the "subRegionData".   

      // To fix this, use PgAdmin to delete the newly created "SubRegions" and "Countries" tables, fix the error in your .json files and re-run this code
    }

    process.exit();
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });