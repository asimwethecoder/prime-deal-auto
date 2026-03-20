export async function GET() {
  const content = `# Prime Deal Auto

> Prime Deal Auto is an online car dealership based in Johannesburg, South Africa, offering a curated inventory of quality used and new vehicles. Browse, search, compare, and enquire about cars with transparent pricing in South African Rand (ZAR).

## About Prime Deal Auto

Prime Deal Auto is located at 515 Louis Botha Ave, Savoy, Johannesburg, 2090. We specialize in providing a seamless online car shopping experience with detailed vehicle information, high-quality images, and direct dealer contact.

**Important:** We do NOT offer financing, payment plans, or installments. All prices are cash prices in ZAR.

## Key Pages

- [Home](https://primedealauto.co.za): Featured cars, brand showcase, and site overview
- [Browse All Cars](https://primedealauto.co.za/cars): Full searchable inventory with pagination
- [About Us](https://primedealauto.co.za/about): Company information and values
- [Contact](https://primedealauto.co.za/contact): Get in touch with our team
- [Ad Listing](https://primedealauto.co.za/ad-listing): List your car for sale
- [FAQs](https://primedealauto.co.za/faqs): Frequently asked questions about buying cars
- [Careers](https://primedealauto.co.za/careers): Career opportunities at Prime Deal Auto

## Inventory Features

- Comprehensive car listings with detailed specifications
- High-quality images for each vehicle
- Transparent pricing in South African Rand (ZAR)
- Filter by make, model, year, price range, body type, fuel type, and transmission
- Detailed car pages with full specifications, features, and contact options
- Direct dealer contact via phone (+27 73 214 4072) or enquiry form

## Car Information

Each car listing includes:
- Make, model, and year
- Price in ZAR (e.g., R250,000)
- Mileage in kilometers
- Transmission type (automatic, manual, CVT)
- Fuel type (petrol, diesel, electric, hybrid)
- Body type (sedan, SUV, hatchback, etc.)
- Condition rating
- Multiple high-resolution images
- Detailed features list
- Full description

## Contact Information

- **Address:** 515 Louis Botha Ave, Savoy, Johannesburg, 2090, South Africa
- **Phone:** +27 73 214 4072
- **Country:** South Africa
- **Currency:** ZAR (South African Rand)

## Optional

- [Sitemap](https://primedealauto.co.za/sitemap.xml): Complete list of all pages and car listings
- [Terms & Conditions](https://primedealauto.co.za/terms): Website terms of use
- [Privacy Notice](https://primedealauto.co.za/privacy): How we handle your data
- [Sign In](https://primedealauto.co.za/signin): User authentication
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
