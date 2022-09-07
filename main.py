import datetime
import time
from string import Template

import pandas as pd
import requests
from bs4 import BeautifulSoup

import config

url = Template('https://comics.ha.com/c/item.zx?saleNo=$saleNo&lotNo=$lotNo')

# saleNo <-> Auction Number
csvHeaders = ['Lot Number', 'Auction Number', 'Url', 'Title', 'Current Price', 'Current # Bids', 'Current # Watchers',
              '# Page Views', 'Time Left']


def parseRow(page: BeautifulSoup, row: []) -> []:
    """
    Assemble the row for the csv file
    Assumes that the page is valid and first 3 values have been input (lot, auction, url)
    """

    # Get the title
    description = page.find(id="auction-description").find_all('b')
    title = ""
    for b in description:
        title += b.text.strip().replace('\n', ' ') + " "
    row.append(title.strip())

    # Get the current price
    price = page.find(class_="current-bid-header").find('span').text.replace('$', '').replace(',', '').strip()
    row.append(price)

    # Get the current number of bids
    bids = page.find(id="number-bids").text.replace(',', '').strip()
    row.append(bids)

    # Get the current number of watchers
    watchers = page.find(id="number-trackers").text.replace(',', '').strip()
    row.append(watchers)

    # Get the number of page views
    views = page.find(id="numberViews").text.replace(',', '').strip()
    row.append(views)

    # Get the time left
    timeLeft = page.find("small", class_="lot-close-time-display").text.strip()
    row.append(timeLeft)

    return row


lotNo = input("Enter Lot Number: ")
saleNo = input("Enter First Sale Number: ")
totalNoItems = input("Enter Total Number of Items: ")

# get cookies and headers from https://curlconverter.com/
cookies = config.cookies
headers = config.headers

data = []

session = requests.Session()

print(f"starting at {datetime.datetime.now()}...")
for i in range(totalNoItems):
    currentLotNo = lotNo + i
    currentUrl = url.substitute(saleNo=saleNo, lotNo=currentLotNo)
    try:
        while 1:
            print(f"getting {currentUrl}...")
            r = session.get(currentUrl, headers=headers)
            if r.status_code == 200:
                break
            else:
                raise Exception(f"status code {r.status_code}")
    except Exception as e:
        print("error getting %s: %s" % (currentUrl, e))
        break

    soup = BeautifulSoup(r.text, 'html.parser')
    currentRow = [currentLotNo, saleNo, currentUrl]
    try:
        print(f"parsing row {i}...")
        currentRow = parseRow(soup, currentRow)
        data.append(currentRow)

    except Exception as e:
        print(f'Error parsing auction @ {currentUrl}, response {r.status_code} with error \n{e}')
        continue

    print("row parsed, sleeping...")
    time.sleep(5)
    print("continuing...")

if len(data) > 0:
    # make the csv file
    dt = datetime.datetime.now()
    timestamp = dt.strftime("%Y%m%d-%H%M%S")
    filename = f'ha_auc{saleNo}_lots{lotNo}-{currentLotNo}_{timestamp}.csv'

    data = pd.DataFrame(data, columns=csvHeaders)
    data.to_csv(filename, index=False)