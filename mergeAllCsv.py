import glob
import pandas as pd

# Get all csv files in the current directory
extension = 'csv'
all_filenames = [i for i in glob.glob('*.{}'.format(extension))]

# Combine all files
combined_csv = pd.concat([pd.read_csv(f) for f in all_filenames ])
combined_csv.drop_duplicates(subset=['Url'], inplace=True)

lots = sorted(combined_csv['Lot Number'].unique().tolist())
auctions = combined_csv['Auction Number'].unique().tolist()
auctionsTyped = [str(a) for a in auctions]
auctionsString = ",".join(auctionsTyped)

# Export to csv
combined_csv.to_csv(f"combined_auc{auctionsString}_lots{lots[0]}-{lots[-1]}.csv", index=False)