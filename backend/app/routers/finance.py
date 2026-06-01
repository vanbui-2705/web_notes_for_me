from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta, date
import re
import unicodedata

from ..database import get_db
from ..utils.auth import get_current_active_user
from ..models import User, Transaction, TransactionCategory, SavingGoal, Budget, Debt
from ..schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionCategoryCreate, TransactionCategoryResponse,
    SavingGoalCreate, SavingGoalUpdate, SavingGoalResponse,
    GoalTransactionCreate, BudgetCreate, BudgetUpdate, BudgetResponse,
    DebtCreate, DebtUpdate, DebtResponse,
    FinanceSummaryResponse, MagicInputRequest
)

router = APIRouter(prefix="/finance", tags=["Finance"])


DEFAULT_CATEGORY_DEFINITIONS = {
    "Food & Dining": {"icon": "🍔", "color": "#FF9800", "type": "expense"},
    "Shopping": {"icon": "🛍️", "color": "#E91E63", "type": "expense"},
    "Transportation": {"icon": "🚗", "color": "#00BCD4", "type": "expense"},
    "Entertainment": {"icon": "🎬", "color": "#9C27B0", "type": "expense"},
    "Salary": {"icon": "💰", "color": "#4CAF50", "type": "income"},
    "Freelance": {"icon": "💻", "color": "#3F51B5", "type": "income"},
}

CATEGORY_KEYWORDS = {
    "Food & Dining": [
        "an", "uong", "pho", "com", "bun", "mi", "my", "cafe", "ca phe", "tra sua",
        "do an", "food", "nuoc", "banh", "sieu thi", "di cho", "quan an"
    ],
    "Transportation": [
        "xe", "xang", "grab", "taxi", "ve xe", "bus", "gui xe", "di chuyen", "transport"
    ],
    "Shopping": [
        "mua", "shopping", "quan ao", "giay", "do dung", "my pham", "phu kien", "shopee", "lazada"
    ],
    "Entertainment": [
        "xem phim", "choi", "nhau", "game", "netflix", "karaoke", "giai tri"
    ],
    "Salary": [
        "luong", "thuong", "salary", "payroll"
    ],
    "Freelance": [
        "du an", "freelance", "part time", "job ngoai", "khach tra"
    ],
}

INCOME_KEYWORDS = [
    "nhan", "luong", "thuong", "lai", "thu nhap", "ban hang", "ban do", "duoc tra",
    "khach tra", "hoan tien", "refund", "nap tien", "tien vao", "chuyen vao", "thu no",
    "cong tien", "duoc cong", "salary", "freelance"
]

EXPENSE_KEYWORDS = [
    "an", "uong", "mua", "chi", "tieu", "tra tien", "thanh toan", "dong tien",
    "mat", "xang", "grab", "taxi", "cafe", "ca phe", "tra sua", "di cho", "shopee",
    "lazada", "nhau", "game", "xem phim", "tra no"
]


def normalize_money_text(text: str) -> str:
    text = text.lower().replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", text).strip()


def extract_amount_from_text(normalized_text: str) -> float:
    amount_match = re.search(
        r"(?<!\w)(\d+(?:[.,]\d+)?)(?:\s*(k|nghin|ngan|tr|trieu|m|cu))?",
        normalized_text
    )
    if not amount_match:
        return 0.0

    raw_value = amount_match.group(1)
    unit = amount_match.group(2)

    if unit:
        value = float(raw_value.replace(",", "."))
    else:
        value = float(raw_value.replace(".", "").replace(",", ""))

    if unit in {"k", "nghin", "ngan"}:
        value *= 1000
    elif unit in {"tr", "trieu", "m", "cu"}:
        value *= 1000000

    return value


def has_keyword(normalized_text: str, keyword: str) -> bool:
    pattern = r"(?<!\w)" + re.escape(keyword) + r"(?!\w)"
    return re.search(pattern, normalized_text) is not None


def infer_transaction_type(normalized_text: str) -> str:
    has_expense_word = any(has_keyword(normalized_text, keyword) for keyword in EXPENSE_KEYWORDS)
    has_income_word = any(has_keyword(normalized_text, keyword) for keyword in INCOME_KEYWORDS)

    if normalized_text.startswith("+"):
        return "income"
    if normalized_text.startswith("-"):
        return "expense"
    if has_expense_word:
        return "expense"
    if has_income_word:
        return "income"
    return "expense"


def infer_category_name(normalized_text: str, transaction_type: str) -> str | None:
    for category_name, keywords in CATEGORY_KEYWORDS.items():
        if any(has_keyword(normalized_text, keyword) for keyword in keywords):
            return category_name
    return "Salary" if transaction_type == "income" else None


async def get_or_create_transaction_category(
    db: AsyncSession,
    user_id: int,
    category_name: str | None
) -> int | None:
    if not category_name:
        return None

    cat_result = await db.execute(
        select(TransactionCategory).filter(
            TransactionCategory.user_id == user_id,
            TransactionCategory.name == category_name
        )
    )
    category = cat_result.scalar_one_or_none()
    if category:
        return category.id

    category_data = DEFAULT_CATEGORY_DEFINITIONS.get(category_name)
    if not category_data:
        return None

    category = TransactionCategory(
        name=category_name,
        user_id=user_id,
        is_system=True,
        **category_data
    )
    db.add(category)
    await db.flush()
    return category.id


# ==================== TRANSACTION CATEGORIES ====================

@router.get("/categories", response_model=list[TransactionCategoryResponse])
async def get_transaction_categories(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all transaction categories for current user"""
    result = await db.execute(
        select(TransactionCategory)
        .filter(TransactionCategory.user_id == current_user.id)
        .order_by(TransactionCategory.type, TransactionCategory.name)
    )
    categories = result.scalars().all()
    
    if not categories:
        default_categories = [
            {"name": "Food & Dining", "icon": "🍔", "color": "#FF9800", "type": "expense", "is_system": True},
            {"name": "Shopping", "icon": "🛍️", "color": "#E91E63", "type": "expense", "is_system": True},
            {"name": "Transportation", "icon": "🚗", "color": "#00BCD4", "type": "expense", "is_system": True},
            {"name": "Entertainment", "icon": "🎬", "color": "#9C27B0", "type": "expense", "is_system": True},
            {"name": "Salary", "icon": "💰", "color": "#4CAF50", "type": "income", "is_system": True},
            {"name": "Freelance", "icon": "💻", "color": "#3F51B5", "type": "income", "is_system": True},
        ]
        categories = []
        for cat_data in default_categories:
            cat = TransactionCategory(**cat_data, user_id=current_user.id)
            db.add(cat)
            categories.append(cat)
        await db.commit()
        for cat in categories:
            await db.refresh(cat)
            
    return categories


@router.post("/categories", response_model=TransactionCategoryResponse)
async def create_transaction_category(
    category_data: TransactionCategoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction category"""
    category = TransactionCategory(
        name=category_data.name,
        icon=category_data.icon,
        color=category_data.color,
        type=category_data.type,
        user_id=current_user.id
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
async def delete_transaction_category(
    category_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction category"""
    result = await db.execute(
        select(TransactionCategory).filter(
            TransactionCategory.id == category_id,
            TransactionCategory.user_id == current_user.id,
            TransactionCategory.is_system == False
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found or cannot be deleted")

    await db.delete(category)
    await db.commit()
    return {"success": True, "message": "Category deleted"}


# ==================== TRANSACTIONS ====================

@router.get("/transactions", response_model=list[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    start_date: date | None = None,
    end_date: date | None = None,
    category_id: int | None = None
):
    """Get all transactions for current user"""
    query = select(Transaction).filter(Transaction.user_id == current_user.id).options(joinedload(Transaction.category))

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    query = query.order_by(Transaction.date.desc(), Transaction.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    transaction = Transaction(
        title=transaction_data.title,
        amount=transaction_data.amount,
        date=transaction_data.date,
        note=transaction_data.note,
        category_id=transaction_data.category_id,
        user_id=current_user.id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    # Eager load category to return correct schema and avoid lazy-load issues
    stmt = select(Transaction).filter(Transaction.id == transaction.id).options(joinedload(Transaction.category))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.post("/magic-input", response_model=TransactionResponse)
async def magic_input_transaction(
    request: MagicInputRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Magic Input: NLP Parsing for transactions (e.g. 'ăn phở 30k', 'nhận lương 15tr')"""
    normalized_text = normalize_money_text(request.text)
    parsed_amount = extract_amount_from_text(normalized_text)

    if parsed_amount == 0:
        raise HTTPException(status_code=400, detail="Khong tim thay so tien hop le trong cau")

    transaction_type = infer_transaction_type(normalized_text)
    if transaction_type == "expense":
        parsed_amount = -parsed_amount

    matched_category_name = infer_category_name(normalized_text, transaction_type)
    parsed_category_id = await get_or_create_transaction_category(db, current_user.id, matched_category_name)

    transaction = Transaction(
        title=request.text.strip().capitalize(),
        amount=parsed_amount,
        date=date.today(),
        category_id=parsed_category_id,
        user_id=current_user.id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    stmt = select(Transaction).filter(Transaction.id == transaction.id).options(joinedload(Transaction.category))
    result = await db.execute(stmt)
    return result.scalar_one()

    text = request.text.lower()
    
    # Extract amount
    # Matches numbers with optional dots, followed by optional spaces and multipliers like k, tr
    amount = 0.0
    amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(k|tr|triệu|ngàn|nghìn)?', text)
    if amount_match:
        val = float(amount_match.group(1).replace('.', ''))
        multiplier = amount_match.group(2)
        if multiplier == 'k' or multiplier == 'ngàn' or multiplier == 'nghìn':
            val *= 1000
        elif multiplier == 'tr' or multiplier == 'triệu':
            val *= 1000000
        amount = val
    
    if amount == 0:
        raise HTTPException(status_code=400, detail="Không tìm thấy số tiền hợp lệ trong câu")
        
    # Extract intent (Expense or Income)
    is_income = any(word in text for word in ['nhận', 'lương', 'được', 'bán', 'thưởng', 'lãi', 'cộng', 'nạp', 'số dư', 'tài khoản', 'vào', 'thu nhập'])
    if not is_income:
        amount = -amount
        
    # Extract category by keyword mapping
    category_mapping = {
        'Food & Dining': ['ăn', 'uống', 'phở', 'cơm', 'bún', 'cafe', 'cà phê', 'trà sữa', 'siêu thị'],
        'Transportation': ['xe', 'xăng', 'grab', 'taxi', 'vé'],
        'Shopping': ['mua', 'quần áo', 'giày', 'đồ'],
        'Entertainment': ['xem phim', 'chơi', 'nhậu', 'game'],
        'Salary': ['lương', 'thưởng'],
        'Freelance': ['dự án', 'freelance', 'part time']
    }
    
    matched_category_name = None
    for cat_name, keywords in category_mapping.items():
        if any(kw in text for kw in keywords):
            matched_category_name = cat_name
            break
            
    # Find matching category from DB
    category_id = None
    if matched_category_name:
        cat_result = await db.execute(
            select(TransactionCategory).filter(
                TransactionCategory.user_id == current_user.id,
                TransactionCategory.name == matched_category_name
            )
        )
        cat = cat_result.scalar_one_or_none()
        if cat:
            category_id = cat.id
            
    # Clean title
    title = request.text.strip().capitalize()
    
    transaction = Transaction(
        title=title,
        amount=amount,
        date=date.today(),
        category_id=category_id,
        user_id=current_user.id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    stmt = select(Transaction).filter(Transaction.id == transaction.id).options(joinedload(Transaction.category))
    result = await db.execute(stmt)
    return result.scalar_one()

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    result = await db.execute(
        select(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    await db.commit()
    await db.refresh(transaction)
    
    # Eager load category to return correct schema and avoid lazy-load issues
    stmt = select(Transaction).filter(Transaction.id == transaction.id).options(joinedload(Transaction.category))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    result = await db.execute(
        select(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()
    return {"success": True, "message": "Transaction deleted"}


# ==================== SAVING GOALS ====================

@router.get("/goals", response_model=list[SavingGoalResponse])
async def get_saving_goals(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all saving goals for current user"""
    result = await db.execute(
        select(SavingGoal).filter(SavingGoal.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/goals", response_model=SavingGoalResponse)
async def create_saving_goal(
    goal_data: SavingGoalCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new saving goal"""
    goal = SavingGoal(
        title=goal_data.title,
        description=goal_data.description,
        target_amount=goal_data.target_amount,
        deadline=goal_data.deadline,
        icon=goal_data.icon,
        color=goal_data.color,
        user_id=current_user.id
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}", response_model=SavingGoalResponse)
async def update_saving_goal(
    goal_id: int,
    goal_data: SavingGoalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a saving goal"""
    result = await db.execute(
        select(SavingGoal).filter(
            SavingGoal.id == goal_id,
            SavingGoal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}")
async def delete_saving_goal(
    goal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a saving goal"""
    result = await db.execute(
        select(SavingGoal).filter(
            SavingGoal.id == goal_id,
            SavingGoal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
    return {"success": True, "message": "Goal deleted"}

@router.post("/goals/{goal_id}/contribute")
async def contribute_to_goal(
    goal_id: int,
    data: GoalTransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Contribute or withdraw amount to/from a saving goal"""
    result = await db.execute(
        select(SavingGoal).filter(
            SavingGoal.id == goal_id,
            SavingGoal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.action == "withdraw":
        if goal.current_amount < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds in goal")
        goal.current_amount -= data.amount
        tx_amount = -data.amount  # Withdraw: hiển thị trừ
        tx_title = f"Rút tiền từ: {goal.title}"
    else:
        goal.current_amount += data.amount
        tx_amount = data.amount  # Deposit: hiển thị cộng
        tx_title = f"Nạp tiền vào: {goal.title}"

    # Create transaction for this contribution
    transaction = Transaction(
        title=tx_title,
        amount=tx_amount,
        date=date.today(),
        note=data.note,
        user_id=current_user.id
    )
    db.add(transaction)

    await db.commit()
    await db.refresh(goal)

    return {
        "success": True,
        "goal": SavingGoalResponse.model_validate(goal),
        "progress_percentage": round((goal.current_amount / goal.target_amount) * 100, 2)
    }


# ==================== FINANCE SUMMARY ====================

@router.get("/summary", response_model=FinanceSummaryResponse)
async def get_finance_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    days: int = 30
):
    """Get finance summary with balance, cash flow, and top spending"""
    # Calculate totals
    totals_query = await db.execute(
        select(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(Transaction.user_id == current_user.id)
    )
    total_balance = totals_query.scalar()

    income_query = await db.execute(
        select(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.amount > 0
        )
    )
    total_income = income_query.scalar()

    expense_query = await db.execute(
        select(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.amount < 0
        )
    )
    total_expense = abs(expense_query.scalar())

    # Cash flow for last N days
    start_date = date.today() - timedelta(days=days)
    cash_flow_query = await db.execute(
        select(
            Transaction.date,
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start_date
        )
        .group_by(Transaction.date)
        .order_by(Transaction.date)
    )
    cash_flow = cash_flow_query.all()

    cash_flow_dict = {str(row.date): float(row.total) for row in cash_flow}
    cash_flow_data = []
    for i in range(days + 1):
        d = start_date + timedelta(days=i)
        d_str = str(d)
        cash_flow_data.append({
            "date": d_str,
            "amount": cash_flow_dict.get(d_str, 0.0)
        })

    # Top spending categories (this month)
    first_day_of_month = date(date.today().year, date.today().month, 1)
    top_categories_query = await db.execute(
        select(
            TransactionCategory.name,
            TransactionCategory.icon,
            TransactionCategory.color,
            func.coalesce(func.sum(Transaction.amount), 0).label("total")
        )
        .join(TransactionCategory, Transaction.category_id == TransactionCategory.id, isouter=True)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.amount < 0,
            Transaction.date >= first_day_of_month
        )
        .group_by(TransactionCategory.id, TransactionCategory.name, TransactionCategory.icon, TransactionCategory.color)
        .order_by(func.sum(Transaction.amount).asc())  # Most negative first
        .limit(5)
    )
    top_categories = top_categories_query.all()

    top_spending_data = [
        {
            "category": row.name or "Uncategorized",
            "icon": row.icon or "💸",
            "color": row.color or "#FF0000",
            "amount": float(abs(row.total))
        }
        for row in top_categories
    ]

    return FinanceSummaryResponse(
        total_balance=round(total_balance, 2),
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        cash_flow_30days=cash_flow_data,
        top_spending_categories=top_spending_data
    )

# ==================== BUDGETS ====================

@router.get("/budgets", response_model=list[BudgetResponse])
async def get_budgets(
    month: int,
    year: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get budgets for a specific month/year"""
    query = select(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month,
        Budget.year == year
    ).options(joinedload(Budget.category))
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/budgets", response_model=BudgetResponse)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update a budget for a category in a specific month/year"""
    # Check if budget already exists
    result = await db.execute(
        select(Budget).filter(
            Budget.user_id == current_user.id,
            Budget.category_id == budget_data.category_id,
            Budget.month == budget_data.month,
            Budget.year == budget_data.year
        )
    )
    existing_budget = result.scalar_one_or_none()
    
    if existing_budget:
        existing_budget.amount = budget_data.amount
        budget = existing_budget
    else:
        budget = Budget(
            user_id=current_user.id,
            category_id=budget_data.category_id,
            amount=budget_data.amount,
            month=budget_data.month,
            year=budget_data.year
        )
        db.add(budget)
        
    await db.commit()
    await db.refresh(budget)
    
    stmt = select(Budget).filter(Budget.id == budget.id).options(joinedload(Budget.category))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a budget"""
    result = await db.execute(
        select(Budget).filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
        
    await db.delete(budget)
    await db.commit()
    return {"success": True, "message": "Budget deleted"}

# ==================== DEBTS ====================

@router.get("/debts", response_model=list[DebtResponse])
async def get_debts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all debts for current user"""
    query = select(Debt).filter(Debt.user_id == current_user.id).order_by(Debt.date.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/debts", response_model=DebtResponse)
async def create_debt(
    debt_data: DebtCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new debt"""
    debt = Debt(
        user_id=current_user.id,
        person_name=debt_data.person_name,
        amount=debt_data.amount,
        type=debt_data.type,
        notes=debt_data.notes
    )
    db.add(debt)
    await db.commit()
    await db.refresh(debt)
    return debt


@router.put("/debts/{debt_id}", response_model=DebtResponse)
async def update_debt(
    debt_id: int,
    debt_data: DebtUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a debt"""
    result = await db.execute(
        select(Debt).filter(
            Debt.id == debt_id,
            Debt.user_id == current_user.id
        )
    )
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
        
    was_settled = debt.is_settled
    
    update_data = debt_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(debt, field, value)
        
    if update_data.get('is_settled') and not was_settled:
        # Add transaction for settlement
        cat_result = await db.execute(
            select(TransactionCategory).filter(
                TransactionCategory.name == "Debt Settlement",
                TransactionCategory.user_id == current_user.id
            )
        )
        cat = cat_result.scalars().first()
        if not cat:
            cat = TransactionCategory(
                name="Debt Settlement",
                type="income" if debt.type == 'lend' else "expense",
                icon="🤝",
                color="#8b5cf6",
                user_id=current_user.id
            )
            db.add(cat)
            await db.flush()
            
        tx = Transaction(
            title=f"Thanh toán nợ: {debt.person_name}",
            amount=debt.amount if debt.type == 'lend' else -debt.amount,
            category_id=cat.id,
            user_id=current_user.id,
            date=debt.date
        )
        db.add(tx)
        
    await db.commit()
    await db.refresh(debt)
    return debt


@router.delete("/debts/{debt_id}")
async def delete_debt(
    debt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a debt"""
    result = await db.execute(
        select(Debt).filter(
            Debt.id == debt_id,
            Debt.user_id == current_user.id
        )
    )
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
        
    await db.delete(debt)
    await db.commit()
    return {"success": True, "message": "Debt deleted"}
