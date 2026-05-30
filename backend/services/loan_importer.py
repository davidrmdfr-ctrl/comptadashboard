"""
Loan Importer - Extracts loan data from amortization schedule PDFs
"""

import re
from pathlib import Path
from datetime import datetime, date, timedelta
from pdfminer.high_level import extract_text

DATA_DIR = Path("Data")

def calculate_principal_left(original_amount, annual_rate, start_date, total_months, current_date=None):
    """Calculate remaining principal for an amortization loan as of today"""
    if current_date is None:
        current_date = date.today()

    # Calculate months elapsed
    months_elapsed = (current_date.year - start_date.year) * 12 + (current_date.month - start_date.month)
    months_elapsed = max(0, min(months_elapsed, total_months))  # Clamp between 0 and total

    # Monthly interest rate
    r = annual_rate / 100 / 12

    # Principal remaining after p payments using amortization formula
    # PV = P * [((1+r)^n - (1+r)^p) / ((1+r)^n - 1)]
    n = total_months
    P = original_amount
    p = months_elapsed

    if r > 0:
        principal_left = P * (((1 + r)**n - (1 + r)**p) / ((1 + r)**n - 1))
    else:
        principal_left = P * (n - p) / n

    return max(0, principal_left)  # Never negative

def calculate_monthly_payment(original_amount, annual_rate, total_months):
    """Calculate monthly payment using standard amortization formula"""
    r = annual_rate / 100 / 12
    n = total_months
    P = original_amount

    if r > 0:
        monthly_payment = P * (r * (1 + r)**n) / ((1 + r)**n - 1)
    else:
        monthly_payment = P / n

    return monthly_payment

def calculate_next_payment_date(start_date, current_date=None):
    """Calculate next payment date (next month after current date)"""
    if current_date is None:
        current_date = date.today()

    # Next payment is on the same day of the month as the start date, in the next month
    next_month = current_date.month + 1
    next_year = current_date.year

    if next_month > 12:
        next_month = 1
        next_year += 1

    # Handle day overflow (e.g., Jan 31 -> Feb 28/29)
    try:
        next_payment = date(next_year, next_month, min(start_date.day, 28))
    except:
        next_payment = date(next_year, next_month, 28)

    return next_payment

def parse_amortization_pdf(filename: str) -> dict:
    """Parse an amortization schedule PDF and extract loan information"""
    file_path = DATA_DIR / filename

    if not file_path.exists():
        return None

    try:
        text = extract_text(str(file_path))
    except Exception as e:
        print(f"Error reading PDF {filename}: {e}")
        return None

    # Extract property name from filename
    property_name = filename.replace("Tableau amortissement ", "").replace(".pdf", "").strip()

    loan_data = {
        "name": f"{property_name} Mortgage",
        "loan_type": "mortgage",
        "original_amount": None,
        "original_currency": "EUR",
        "principal_left": None,
        "next_payment_amount": None,
        "next_payment_date": None,
        "interest_rate": None,
        "payment_frequency": "monthly",
        "start_date": None,
        "end_date": None,
        "notes": f"Amortization schedule: {filename}",
        "property_name": property_name,
    }

    total_months = None

    try:
        # Extract original amount from "MONTANT TOTAL DEBLOQUE" (more reliable position)
        # Pattern: "MONTANT TOTAL DEBLOQUE : EUR 200 000,00"
        amount_match = re.search(r'MONTANT TOTAL D[ÉE]BLOQU[ÉE]\s*:\s*EUR\s+([\d\s,\.]+)', text)
        if amount_match:
            amount_str = amount_match.group(1).strip().replace(' ', '').replace(',', '.')
            loan_data["original_amount"] = float(amount_str)

        # If that didn't work, try "MONTANT DU PRET" with multiline search
        if loan_data["original_amount"] is None:
            # Look for any amount that comes after MONTANT DU PRET within 500 chars
            pret_idx = text.find("MONTANT DU PRET")
            if pret_idx >= 0:
                search_text = text[pret_idx:pret_idx+500]
                # Find all numbers in this section
                amounts = re.findall(r'([\d\s]+[\d,\.]{2,})', search_text)
                if amounts:
                    # Take the first one that looks like an amount
                    for amt in amounts:
                        try:
                            amt_clean = amt.replace(' ', '').replace(',', '.')
                            val = float(amt_clean)
                            if val > 10000:  # Reasonable minimum for a mortgage
                                loan_data["original_amount"] = val
                                break
                        except:
                            pass

        # Extract interest rate (TAUX DEBITEUR or TAUX D'INTERET)
        rate_match = re.search(r'TAUX D[\'E].*?EN COURS\s*:\s*([\d,\.]+)\s*%', text)
        if rate_match:
            rate_str = rate_match.group(1).replace(',', '.')
            loan_data["interest_rate"] = float(rate_str)

        # Extract start date (DATE DE DEPART DU PRET)
        start_match = re.search(r'DATE DE D[ÉE]PART DU PR[EÊ]T\s*:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})', text)
        if start_match:
            day, month, year = start_match.groups()
            loan_data["start_date"] = date(int(year), int(month), int(day))

        # Extract total duration in months (DUREE TOTALE DU PRET)
        duration_match = re.search(r'DUR[ÉE]E TOTALE.*?DU PR[EÊ]T\s*:\s*(\d+)\s*MOIS', text)
        if duration_match and loan_data["start_date"]:
            total_months = int(duration_match.group(1))
            # Calculate end date
            start = loan_data["start_date"]
            end_year = start.year + (start.month + total_months - 1) // 12
            end_month = (start.month + total_months - 1) % 12 + 1
            # Use last day of that month
            if end_month == 12:
                next_first = date(end_year + 1, 1, 1)
            else:
                next_first = date(end_year, end_month + 1, 1)
            last_day = (next_first - timedelta(days=1)).day
            loan_data["end_date"] = date(end_year, end_month, last_day)

        # Extract monthly payment amount and remaining balance from amortization table
        # Look for the first month entry in the amortization table
        month_pattern = r'(?:JANVIER|F[ÉE]VRIER|MARS|AVRIL|MAI|JUIN|JUILLET|AO[UÛ]T|SEPTEMBRE|OCTOBRE|NOVEMBRE|D[ÉE]CEMBRE)'
        lines = text.split('\n')

        for line in lines:
            # Check if this line contains a month name (start of amortization table)
            if re.search(month_pattern, line.upper()):
                # Extract all numbers from this amortization line
                # Format is typically: MONTH YEAR NUM TOTAL_PAY INTEREST PRINCIPAL REMAINING
                numbers = re.findall(r'[\d\s,]+', line)
                if numbers:
                    try:
                        # Convert all to floats
                        floats = []
                        for num_str in numbers:
                            clean = num_str.strip().replace(' ', '').replace(',', '.')
                            if clean and clean.count('.') <= 1:  # Valid float format
                                floats.append(float(clean))

                        if len(floats) >= 3:
                            # Typically the pattern is:
                            # num, total_payment, interest, principal, remaining_balance
                            # We want total_payment and remaining_balance
                            if len(floats) >= 5:
                                loan_data["next_payment_amount"] = floats[1]  # Total payment
                                loan_data["principal_left"] = floats[-1]  # Remaining balance (last number)
                            elif len(floats) >= 3:
                                loan_data["next_payment_amount"] = floats[1]
                                loan_data["principal_left"] = floats[-1]

                            # Calculate next payment date (one month after start)
                            if loan_data["start_date"]:
                                start = loan_data["start_date"]
                                if start.month == 12:
                                    loan_data["next_payment_date"] = date(start.year + 1, 1, start.day)
                                else:
                                    loan_data["next_payment_date"] = date(start.year, start.month + 1, start.day)
                        break
                    except Exception as e:
                        pass

        # Calculate correct principal_left based on current date (accounting for payments made)
        if loan_data["original_amount"] and loan_data["start_date"] and loan_data["interest_rate"] and total_months:
            loan_data["principal_left"] = calculate_principal_left(
                loan_data["original_amount"],
                loan_data["interest_rate"],
                loan_data["start_date"],
                total_months
            )
        elif loan_data["principal_left"] is None and loan_data["original_amount"]:
            loan_data["principal_left"] = loan_data["original_amount"]

        # Calculate next payment date based on current date
        if loan_data["next_payment_date"] is None and loan_data["start_date"]:
            loan_data["next_payment_date"] = calculate_next_payment_date(loan_data["start_date"])

        # Calculate next payment amount using amortization formula
        if loan_data["next_payment_amount"] is None and loan_data["original_amount"] and loan_data["interest_rate"] and total_months:
            loan_data["next_payment_amount"] = calculate_monthly_payment(
                loan_data["original_amount"],
                loan_data["interest_rate"],
                total_months
            )

    except Exception as e:
        print(f"Error parsing PDF content: {e}")

    return loan_data


def get_available_loans() -> list:
    """Get all available loans from amortization PDFs"""
    loans = []

    for pdf_file in DATA_DIR.glob("Tableau amortissement *.pdf"):
        loan = parse_amortization_pdf(pdf_file.name)
        if loan and loan.get("original_amount"):  # Only include if we extracted the amount
            loans.append(loan)

    return loans
