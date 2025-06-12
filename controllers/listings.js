const Listing = require('../models/listing');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN; // Ensure you have set this environment variable
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

module.exports.index =async (req,res)=>{
     const allListings = await Listing.find({});
     res.render("listings/index.ejs",{allListings});
     };

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
    .populate({path:'reviews',
        populate: {
            path: 'author',
        },
    })
    .populate('owner'); // populate reviews and owner
    if(!listing){
        req.flash("error","Listing Not Found!");// this is not showing up when the listing is not found
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing}); // pass the map token to the template
    };

module.exports.createListing = async (req,res,next)=>{   
  let response=  await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
  .send();

 // res.send("DONE!");
    
    let url = req.file.path;
    let filename = req.file.filename;
   const newListing=new Listing(req.body.listing);  
   newListing.owner=req.user._id; // set the owner to the logged in user
   newListing.image = { url, filename }; // set the image field with the uploaded file details
   
 const coordinates = response.body.features[0].geometry.coordinates;
  newListing.geometry = { type: "Point", coordinates }; // <-- FIXED LINE   let savedListing=await newListing.save();
   let savedListing = await newListing.save();

  console.log(savedListing);
   req.flash("success","New Listing Created Successfully!");
    res.redirect("/listings"); 
    
   };

module.exports.renderEditForm = async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        console.log("Listing Not Found!");
        req.flash("error","Listing Not Found!");// this is not showing up when the listing is not found
        return res.redirect("/listings");
    }

let originalImageUrl=listing.image.url;
originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
res.render("listings/edit.ejs",{listing, originalImageUrl});
 };



 module.exports.updateListing = async (req,res)=>{
     let {id}=req.params;
     
     let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
     if(typeof req.file!== 'undefined' ){
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image={url,filename};
      await listing.save();
     }
    
    req.flash("success","Listing Updated Successfully!");
     res.redirect(`/listings/${id}`); // redirect to the show page of the updated listing
    
 };

 module.exports.destroyListing = async (req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted Successfully!");
    res.redirect("/listings");
};