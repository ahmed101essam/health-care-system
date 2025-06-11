class APIFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }

  filter() {
    let queryObj = { ...this.reqQuery };

    const excludedFields = ["sort", "page", "limit", "fields"];

    excludedFields.forEach((f) => delete queryObj[f]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    queryObj = JSON.parse(queryStr);

    console.log(queryObj);

    this.query = this.query.find(queryObj);

    return this;
  }

  sort() {
    if (this.reqQuery.sort) {
      this.reqQuery.sort = this.reqQuery.sort.replace(",", " ");
      this.query = this.query.sort(this.reqQuery.sort);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  fields(defaultFields) {
    let fields;
    if (this.reqQuery.fields) {
      this.reqQuery.fields = this.reqQuery.fields.replace(",", " ");
      fields = this.reqQuery.fields;
    } else {
      fields = defaultFields;
    }

    this.query = this.query.select(fields);
    return this;
  }
  pagination() {
    const page = Number(this.reqQuery.page) || 1;

    const limit = Number(this.reqQuery.limit) || 10;

    const offset = (page - 1) * limit;

    this.query = this.query.skip(offset).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
