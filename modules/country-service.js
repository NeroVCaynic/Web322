const env = require('dotenv').config();
const pg = require('pg'); // explicitly require the "pg" module
const Sequelize = require('sequelize');
// const countryData = require("../data/countryData");
// const subRegionData = require("../data/subRegionData");

// let countries = [];
let sequelize = new Sequelize(
  env.PGDATABASE, 
  env.PGUSER, 
  env.PGPASSWORD, 
  {
  host: env.PGHOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

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
);

Country.belongsTo(SubRegion, {foreignKey: 'subRegionId'});

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(()=>{
      resolve();
    }).catch((err)=>{
      reject(err);
    });
  });
}

function getAllCountries() {
  return new Promise((resolve, reject) => {
    Country.findAll({ include: [SubRegion] })
    .then((countries) => {
      resolve(countries);
    }).catch((err) => {
      reject("Unable to retrieve countries");
    });
  });
}

function getCountryById(id) {
  return new Promise((resolve, reject) => {
    Country.findAll({
      where: { id: id },
      include: [SubRegion],
    })
    .then((countries) => {
      if (countries.length > 0) {
        resolve(countries[0]);
      }
      reject("Unable to find requested country");
    }).catch((err) => {
      reject(err);
    });
  });
}

function getCountriesBySubRegion(subRegion) {
  return new Promise((resolve, reject) => {
    Country.findAll({
      include: [SubRegion],
      where: {
        '$SubRegion.subRegion$': {
          [Sequelize.Op.iLike]: `%${subRegion}%`,
        },
      },
    })
    .then((countries) => {
      if (countries.length > 0) {
        resolve(countries);
      }
      reject("Unable to find requested countries");
    }).catch((err) => {
      reject(err);
    });
  });
}

function getCountriesByRegion(region) {
  return new Promise((resolve, reject) => {
    Country.findAll({
      include: [SubRegion],
      where: {
        '$SubRegion.region$': region,
      },
    })
    .then((countries) => {
      if (countries.length > 0) {
        resolve(countries);
      }
      reject("Unable to find requested countries");
    }).catch((err) => {
      reject(err);
    });
  });
}

function getAllSubRegions() {
  return new Promise((resolve, reject) => {
    SubRegion.findAll()
    .then((subRegions) => {
      resolve(subRegions);
    }).catch((err) => {
      reject("Unable to retrieve SubRegions");
    });
  });
}

function addCountry(data) {
  return new Promise((resolve, reject) => {
    Country.create(data)
    .then((country) => {
      resolve(country);
    }).catch((err) => {
      reject("Unable to add country");
    });
  });
}

function editCountry(id, countryData) {
  return new Promise((resolve, reject) => {
    Country.update(countryData, {
      where: { id: id },
    })
    .then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}

function deleteCountry(id) {
  return new Promise((resolve, reject) => {
    Country.destroy({
      where: { id: id },
    })
    .then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}

module.exports = { initialize, getAllCountries, getCountryById, getCountriesByRegion, getCountriesBySubRegion, getAllSubRegions, addCountry, editCountry, deleteCountry }

// // Code Snippet to insert existing data from Countries / SubRegions
// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await SubRegion.bulkCreate(subRegionData);
//       await Country.bulkCreate(countryData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Countries" violates foreign key constraint "Countries_subRegionId_fkey"

//       // it is because you have a "Country" in your collection that has a "subRegionId" that does not exist in the "subRegionData".   

//       // To fix this, use PgAdmin to delete the newly created "SubRegions" and "Countries" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });