# Waste Bud - Tyler Baldeviso and Marty Macalalad

Even with the newfound abundance of categroized waste bins, most people still don't discard them in the proper place.  Waste Bud is here to help solve this problem by to categorize images of different kinds of waste to their respective categories: Cans and Bottles, Landfill, and Compost.  This project was aimed to promote education into better recycling practicing to help contribute to growing the sustainability of our Earth.

## Tools
- Google Cloud Vision API for categorizing images
- Javascript for front-end and back-end
- HTML and CSS for website layout

Our current implementation looks into the label descriptions in the JSON provided by Google Cloud Vision.  We compare regular expressions of common objects within each category and choose the best one accordingly.  We can improve upon this in the future by perhaps using the AutoML Google Cloud service instead to train the analyzer to categorize the waste better.