from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

# ============================================================================
# CASH ACCOUNTS
# ============================================================================
class CashAccount(Base):
    __tablename__ = "cash_accounts"

    id = Column(Integer, primary_key=True)
    currency = Column(String(3), nullable=False)  # EUR, SGD, GBP, etc.
    amount = Column(Float, nullable=False)  # Amount in that currency
    eur_amount = Column(Float, nullable=False)  # Converted to EUR
    exchange_rate = Column(Float, nullable=False)  # Rate to EUR
    account_name = Column(String(100), nullable=True)  # e.g., "HSBC SG", "Interactive Broker"
    account_type = Column(String(50), nullable=True)  # e.g., "checking", "savings"
    parent_id = Column(Integer, ForeignKey("cash_accounts.id"), nullable=True)  # For sub-accounts
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    children = relationship("CashAccount", remote_side=[id], cascade="all, delete-orphan", single_parent=True)

    def __repr__(self):
        return f"<CashAccount {self.currency} {self.amount}>"

# ============================================================================
# INVESTMENTS (Stocks, ETFs, Bonds, Crypto)
# ============================================================================
class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(10), nullable=False)  # e.g., "DBS", "3 rue des roses"
    isin = Column(String(12), nullable=True)  # e.g., "LU1261432659" for fund identification
    ticker_symbol = Column(String(20), nullable=True)  # Exchange-specific ticker for yfinance (e.g., "FWRD.L", "FWRD.DE")
    name = Column(String(100), nullable=True)
    investment_type = Column(String(20), nullable=False)  # "stock", "etf", "bond", "crypto", "broker"
    quantity = Column(Float, nullable=False)
    initial_amount = Column(Float, nullable=False)  # Total invested amount
    cost_per_unit = Column(Float, nullable=True)  # initial_amount ÷ quantity
    currency = Column(String(3), nullable=False)  # Trading currency
    exchange_rate = Column(Float, default=1.0)  # Exchange rate for currency conversion
    eur_initial_amount = Column(Float, nullable=False)  # Initial amount converted to EUR
    current_price = Column(Float, nullable=False)  # Latest price per unit
    current_amount = Column(Float, nullable=False)  # Current value in original currency
    eur_current_amount = Column(Float, nullable=False)  # Current value converted to EUR
    yield_pct = Column(Float, nullable=True)  # Yield or return %
    acquisition_date = Column(Date, nullable=True)
    account_name = Column(String(100), nullable=True)  # e.g., "HSBC HK", "Interactive Broker"
    is_broker = Column(Boolean, default=False)  # True if this is a broker account
    parent_id = Column(Integer, ForeignKey("investments.id"), nullable=True)  # Parent broker
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    children = relationship("Investment", remote_side=[id], cascade="all, delete-orphan", single_parent=True)

    def __repr__(self):
        return f"<Investment {self.symbol} x{self.quantity}>"

# ============================================================================
# PROPERTIES (Real Estate)
# ============================================================================
class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # e.g., "Roses", "Wagner"
    location = Column(String(200), nullable=True)
    property_type = Column(String(20), nullable=False)  # "rental", "primary", "investment"
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    rental_income = Column(Float, default=0)  # Monthly rental income
    coupon_rate = Column(Float, default=0)  # Yield %
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    amortizations = relationship("PropertyAmortization", back_populates="property", cascade="all, delete-orphan")
    cashflows = relationship("PropertyCashflow", back_populates="property", cascade="all, delete-orphan")
    equities = relationship("PropertyEquity", back_populates="property", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Property {self.name}>"

# ============================================================================
# PROPERTY AMORTIZATION (Loan repayment schedule)
# ============================================================================
class PropertyAmortization(Base):
    __tablename__ = "property_amortization"

    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    month = Column(Integer, nullable=False)  # Month index (1, 2, 3, ...)
    date = Column(Date, nullable=False)  # Actual date
    capital_left = Column(Float, nullable=False)  # Remaining capital
    interest_paid = Column(Float, nullable=False)
    principal_paid = Column(Float, nullable=False)
    total_paid = Column(Float, nullable=False)  # interest + principal
    amortization_rate = Column(Float, nullable=True)  # Annual rate
    loan_duration = Column(Integer, nullable=True)  # Years

    property = relationship("Property", back_populates="amortizations")

    def __repr__(self):
        return f"<PropertyAmortization {self.property_id} month {self.month}>"

# ============================================================================
# PROPERTY CASHFLOW (Rental income and expenses)
# ============================================================================
class PropertyCashflow(Base):
    __tablename__ = "property_cashflow"

    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    month = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    gross_income = Column(Float, nullable=False)  # Rental income
    expenses = Column(Float, nullable=False)  # Maintenance, taxes, etc.
    net_income = Column(Float, nullable=False)  # gross - expenses
    value_t1 = Column(Float, nullable=True)  # Property value end of period
    net_value = Column(Float, nullable=True)  # After deductions

    property = relationship("Property", back_populates="cashflows")

    def __repr__(self):
        return f"<PropertyCashflow {self.property_id} month {self.month}>"

# ============================================================================
# PROPERTY EQUITY (Net worth tracking)
# ============================================================================
class PropertyEquity(Base):
    __tablename__ = "property_equity"

    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    month = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    net_equity = Column(Float, nullable=False)  # Property value - debt
    real_net_equity = Column(Float, nullable=False)  # After all costs

    property = relationship("Property", back_populates="equities")

    def __repr__(self):
        return f"<PropertyEquity {self.property_id} month {self.month}>"

# ============================================================================
# MONTHLY SNAPSHOTS (Total portfolio value)
# ============================================================================
class MonthlySnapshot(Base):
    __tablename__ = "monthly_snapshots"

    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False, unique=True)
    total_assets_eur = Column(Float, nullable=False)  # Total AUM in EUR
    total_debt_eur = Column(Float, nullable=False)
    net_equity_eur = Column(Float, nullable=False)  # Assets - Debt
    cash_breakdown = Column(Text, nullable=True)  # JSON: currency breakdown
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<MonthlySnapshot {self.date} EUR {self.total_assets_eur:.2f}>"

# ============================================================================
# TAX DATA (Annual tax information)
# ============================================================================
class TaxData(Base):
    __tablename__ = "tax_data"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False, unique=True)
    income = Column(Float, nullable=False)
    earned_income_relief = Column(Float, nullable=True)
    qualifying_child_relief = Column(Float, nullable=True)
    other_reliefs = Column(Float, nullable=True)
    taxable_income = Column(Float, nullable=False)
    pre_rebate_tax = Column(Float, nullable=False)
    tax_rebates = Column(Float, nullable=True)
    total_tax = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TaxData {self.year}>"

# ============================================================================
# MARKET DATA (Cached prices)
# ============================================================================
class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True)
    symbol = Column(String(10), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False)
    date = Column(Date, nullable=False)
    source = Column(String(50), nullable=True)  # "yfinance", "coingecko", etc.
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<MarketData {self.symbol} {self.price}>"

# ============================================================================
# FORECAST DATA (Projections)
# ============================================================================
class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True)
    projection_date = Column(Date, nullable=False)  # When forecast was made
    months_ahead = Column(Integer, nullable=False)  # How many months to project
    assumed_yield = Column(Float, nullable=False)  # % assumed annual return
    assumed_cashflow = Column(Float, nullable=False)  # Monthly additions
    projected_value = Column(Float, nullable=False)  # Projected AUM
    assumptions = Column(Text, nullable=True)  # JSON: full assumptions
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Forecast {self.projection_date} +{self.months_ahead}m>"

# ============================================================================
# LOANS (Mortgages, personal loans, car loans, etc.)
# ============================================================================
class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # e.g., "Roses Mortgage"
    loan_type = Column(String(20), nullable=False)  # "mortgage", "personal", "car", "business"
    original_amount = Column(Float, nullable=False)  # Original loan amount
    original_currency = Column(String(3), default="EUR")
    principal_left = Column(Float, nullable=False)  # Remaining principal
    next_payment_amount = Column(Float, nullable=False)  # Next payment due
    next_payment_date = Column(Date, nullable=False)  # Next payment date
    interest_rate = Column(Float, nullable=True)  # Annual interest rate %
    payment_frequency = Column(String(20), nullable=False, default="monthly")  # "monthly", "quarterly", etc.
    start_date = Column(Date, nullable=False)  # Loan start date
    end_date = Column(Date, nullable=True)  # Expected end date
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Loan {self.name} {self.principal_left}>"

# ============================================================================
# PENSION FUNDS
# ============================================================================
class PensionFund(Base):
    __tablename__ = "pension_funds"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # e.g., "DBS SRS", "BNP Paribas"
    provider = Column(String(100), nullable=True)  # e.g., "AXA", "Legal & General"
    fund_type = Column(String(20), nullable=False)  # "workplace", "personal"
    initial_amount = Column(Float, nullable=False)  # Initial investment amount in original currency
    eur_initial_amount = Column(Float, nullable=False)  # Initial amount in EUR
    current_amount = Column(Float, nullable=False)  # Current value in original currency
    currency = Column(String(3), default="EUR")  # Currency of investment
    exchange_rate = Column(Float, default=1.0)  # Exchange rate for currency conversion
    eur_current_amount = Column(Float, nullable=False)  # Current value in EUR
    acquisition_date = Column(Date, nullable=True)
    expected_retirement_age = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PensionFund {self.name}>"
